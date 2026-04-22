import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matters, checklistItems, titleAnalyses, statusUpdates, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser, checkSubscriptionAccess } from "@/lib/db/get-user"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)
  const access = await checkSubscriptionAccess(user)
  if (!access.allowed) return NextResponse.json({ error: access.message }, { status: 403 })

  const { matterId } = await req.json()
  if (!matterId) return NextResponse.json({ error: "matterId required" }, { status: 400 })

  const matterRows = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)

  if (matterRows.length === 0) return NextResponse.json({ error: "Matter not found" }, { status: 404 })

  const matter = matterRows[0]
  const items = await db.select().from(checklistItems).where(eq(checklistItems.matterId, matterId)).orderBy(checklistItems.sortOrder)

  const recentAnalyses = await db.select({
    propertyAddress: titleAnalyses.propertyAddress,
    analysis: titleAnalyses.analysis,
    createdAt: titleAnalyses.createdAt,
  }).from(titleAnalyses)
    .where(and(eq(titleAnalyses.userId, user.id), eq(titleAnalyses.matterId, matterId)))
    .orderBy(titleAnalyses.createdAt)
    .limit(3)

  const pending = items.filter(i => i.status === "pending")
  const inProgress = items.filter(i => i.status === "in_progress")
  const complete = items.filter(i => i.status === "complete")
  const totalItems = items.length
  const pct = totalItems > 0 ? Math.round((complete.length / totalItems) * 100) : 0

  const prompt = `You are an autonomous closing coordinator AI. Analyze this real estate closing matter and provide actionable intelligence.

MATTER:
- Client: ${matter.clientName}
- Property: ${matter.propertyAddress}
- Type: ${matter.transactionType}
- Closing: ${matter.closingDate ? new Date(matter.closingDate).toLocaleDateString() : "TBD"}
- State: ${matter.state ?? "Not specified"}
- Status: ${matter.status}

CHECKLIST PROGRESS: ${pct}% complete (${complete.length}/${totalItems} items)

COMPLETED ITEMS:
${complete.map(i => `- ${i.title}`).join("\n") || "None"}

IN-PROGRESS ITEMS:
${inProgress.map(i => `- ${i.title}${i.dueDate ? ` (due ${new Date(i.dueDate).toLocaleDateString()})` : ""}`).join("\n") || "None"}

PENDING ITEMS:
${pending.map(i => `- ${i.title} (assigned: ${i.assignedTo ?? "unassigned"})`).join("\n") || "None"}

RECENT TITLE ANALYSES:
${recentAnalyses.length > 0 ? recentAnalyses.map(a => {
  const analysis = a.analysis as any
  return `- Analyzed: ${a.propertyAddress ?? matter.propertyAddress}\n  Red flags: ${analysis?.redFlags?.length ?? 0}\n  Summary: ${analysis?.summary ?? "N/A"}`
}).join("\n") : "No title analyses linked to this matter yet"}

${SAFETY_PREAMBLE}

Provide a comprehensive closing coordinator report as JSON:
{
  "overall_status": "on_track" | "needs_attention" | "at_risk" | "critical",
  "status_summary": "2-3 sentence plain-English status of this closing",
  "immediate_actions": [
    {
      "action": "specific thing to do right now",
      "assigned_to": "attorney | buyer | seller | lender | title_company | agent",
      "urgency": "today | this_week | before_closing",
      "reason": "why this matters"
    }
  ],
  "blockers": [
    {
      "item": "what is blocking progress",
      "impact": "what happens if not resolved",
      "resolution": "how to resolve it"
    }
  ],
  "checklist_updates": [
    {
      "item_title": "exact title from pending/in_progress list",
      "suggested_status": "in_progress" | "complete",
      "reason": "why this status makes sense given available info"
    }
  ],
  "draft_status_email": {
    "subject": "email subject line for client update",
    "body": "full professional status email body (100-200 words)"
  },
  "risk_flags": [
    "any title issues, deadline risks, or compliance concerns worth flagging"
  ]
}`

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    })

    const textBlock = message.content.find(b => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from agent" }, { status: 502 })
    }

    let report: unknown
    try {
      const cleaned = textBlock.text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      report = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "Failed to parse agent response" }, { status: 502 })
    }

    // Auto-apply suggested checklist updates
    const reportData = report as any
    let updatedItems = 0
    if (Array.isArray(reportData.checklist_updates)) {
      for (const update of reportData.checklist_updates) {
        const matchingItem = items.find(i =>
          i.title.toLowerCase().includes(update.item_title?.toLowerCase().slice(0, 30))
        )
        if (matchingItem && update.suggested_status && matchingItem.status !== update.suggested_status) {
          await db.update(checklistItems)
            .set({ status: update.suggested_status, updatedAt: new Date() })
            .where(eq(checklistItems.id, matchingItem.id))
          updatedItems++
        }
      }
    }

    // Save the draft status email as a status update record
    if (reportData.draft_status_email?.body) {
      await db.insert(statusUpdates).values({
        userId: user.id,
        matterId,
        clientName: matter.clientName,
        propertyAddress: matter.propertyAddress,
        transactionType: matter.transactionType,
        closingStage: `${pct}% complete`,
        generatedEmail: `Subject: ${reportData.draft_status_email.subject}\n\n${reportData.draft_status_email.body}`,
        tone: "professional",
      })
    }

    logger.info("agent/analyze-matter", "Analysis complete", { matterId, updatedItems })

    return NextResponse.json({ report, updatedItems })
  } catch (err) {
    logger.error("agent/analyze-matter", "Analysis failed", { error: String(err) })
    return NextResponse.json({ error: "Agent analysis failed" }, { status: 502 })
  }
}
