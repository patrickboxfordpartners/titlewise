import { db } from "@/lib/db"
import {
  matters, checklistItems, matterParties, documentSlots,
  emailThreads,
} from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { sendEmail } from "@/lib/email/send"
import type { AisaTool } from "./aisa"

export type ToolContext = {
  matterId: string
  userId: string
  userName: string
  userEmail: string
  confirmationGranted?: boolean
}

export const NEIL_TOOLS: AisaTool[] = [
  {
    type: "function",
    function: {
      name: "get_matter_summary",
      description: "Get matter overview: address, closing date, status, party count, checklist progress",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_checklist",
      description: "Get all checklist items with status, assignee, and due dates",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_parties",
      description: "Get all parties on this matter (name, role, email, phone)",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_documents",
      description: "Get document slots showing which documents are received vs pending",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_threads",
      description: "Get recent email threads on this matter",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wire_history",
      description: "Get past wire verification results for this matter's parties",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "update_checklist_item",
      description: "Update a checklist item's status or notes",
      parameters: {
        type: "object",
        properties: {
          item_title: { type: "string", description: "Title of the checklist item to update" },
          status: { type: "string", enum: ["pending", "in_progress", "complete"], description: "New status" },
        },
        required: ["item_title", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_party",
      description: "Add a new party to the matter",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Person or company name" },
          role: { type: "string", enum: ["buyer", "seller", "buyers_agent", "listing_agent", "lender", "other"], description: "Role in transaction" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
          company: { type: "string", description: "Company name" },
        },
        required: ["name", "role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_status_update",
      description: "Generate a draft status update email to send to selected parties. Always show the draft and ask user to confirm before sending.",
      parameters: {
        type: "object",
        properties: {
          recipients: { type: "array", items: { type: "string" }, description: "Party roles to send to (e.g. ['buyers_agent', 'lender'])" },
          key_points: { type: "array", items: { type: "string" }, description: "Key points to cover in the update" },
        },
        required: ["recipients", "key_points"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send a previously drafted email. ONLY call this after the user has explicitly confirmed the draft.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body text" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_document",
      description: "Analyze document text (auto-detects type: closing disclosure, title commitment, or HOA docs)",
      parameters: {
        type: "object",
        properties: {
          document_text: { type: "string", description: "Full text content of the document to analyze" },
          document_type: { type: "string", enum: ["cd", "commitment", "hoa"], description: "Document type if known" },
        },
        required: ["document_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "verify_wire",
      description: "Verify wire instructions against known patterns to detect potential fraud",
      parameters: {
        type: "object",
        properties: {
          bank_name: { type: "string" },
          routing_number: { type: "string" },
          account_number: { type: "string" },
          beneficiary: { type: "string" },
        },
        required: ["bank_name", "routing_number", "account_number"],
      },
    },
  },
]

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  switch (name) {
    case "get_matter_summary": {
      const [matter] = await db.select().from(matters)
        .where(and(eq(matters.id, ctx.matterId), eq(matters.userId, ctx.userId)))
        .limit(1)
      if (!matter) return "Matter not found"
      const items = await db.select().from(checklistItems).where(eq(checklistItems.matterId, ctx.matterId))
      const parties = await db.select().from(matterParties).where(eq(matterParties.matterId, ctx.matterId))
      const complete = items.filter(i => i.status === "complete").length
      return JSON.stringify({
        client: matter.clientName,
        address: matter.propertyAddress,
        type: matter.transactionType,
        closing_date: matter.closingDate,
        state: matter.state,
        status: matter.status,
        parties_count: parties.length,
        checklist: `${complete}/${items.length} complete`,
      })
    }

    case "get_checklist": {
      const items = await db.select().from(checklistItems)
        .where(eq(checklistItems.matterId, ctx.matterId))
        .orderBy(checklistItems.sortOrder)
      return JSON.stringify(items.map(i => ({
        title: i.title,
        status: i.status,
        assigned_to: i.assignedTo,
        due_date: i.dueDate,
      })))
    }

    case "get_parties": {
      const parties = await db.select().from(matterParties)
        .where(eq(matterParties.matterId, ctx.matterId))
      return JSON.stringify(parties.map(p => ({
        name: p.name,
        role: p.role,
        email: p.email,
        phone: p.phone,
        company: p.company,
      })))
    }

    case "get_documents": {
      const docs = await db.select().from(documentSlots)
        .where(eq(documentSlots.matterId, ctx.matterId))
        .orderBy(documentSlots.sortOrder)
      return JSON.stringify(docs.map(d => ({
        label: d.label,
        category: d.category,
        status: d.status,
        notes: d.notes,
      })))
    }

    case "get_email_threads": {
      const threads = await db.select().from(emailThreads)
        .where(eq(emailThreads.matterId, ctx.matterId))
        .orderBy(desc(emailThreads.createdAt))
        .limit(20)
      return JSON.stringify(threads.map(t => ({
        direction: t.direction,
        from: t.fromAddress,
        to: t.toAddress,
        subject: t.subject,
        date: t.createdAt,
        preview: t.bodyText?.slice(0, 200),
      })))
    }

    case "get_wire_history": {
      return JSON.stringify({ message: "No wire verifications found for this matter yet." })
    }

    case "update_checklist_item": {
      const title = args.item_title as string
      const status = args.status as string
      const items = await db.select().from(checklistItems)
        .where(eq(checklistItems.matterId, ctx.matterId))
      const match = items.find(i => i.title.toLowerCase().includes(title.toLowerCase()))
      if (!match) return JSON.stringify({ error: `No checklist item matching "${title}"` })
      await db.update(checklistItems)
        .set({ status, updatedAt: new Date() })
        .where(eq(checklistItems.id, match.id))
      return JSON.stringify({ updated: match.title, new_status: status })
    }

    case "add_party": {
      const [party] = await db.insert(matterParties).values({
        matterId: ctx.matterId,
        name: args.name as string,
        role: args.role as string,
        email: (args.email as string) || null,
        phone: (args.phone as string) || null,
        company: (args.company as string) || null,
      }).returning()
      return JSON.stringify({ added: party.name, role: party.role })
    }

    case "draft_status_update": {
      const recipients = args.recipients as string[]
      const keyPoints = args.key_points as string[]
      const parties = await db.select().from(matterParties)
        .where(eq(matterParties.matterId, ctx.matterId))
      const matched = parties.filter(p => recipients.includes(p.role))
      const recipientDetails = matched.map(p => ({ name: p.name, role: p.role, email: p.email }))
      return JSON.stringify({
        action: "draft_ready",
        recipients: recipientDetails,
        key_points: keyPoints,
        instruction: "Compose the email draft in your response. Show the To, Subject, and Body. Then ask the user to confirm before calling send_email.",
      })
    }

    case "send_email": {
      const to = args.to as string
      const subject = args.subject as string
      const body = args.body as string
      if (!to || !subject || !body) {
        return JSON.stringify({ error: "Missing required fields: to, subject, body" })
      }
      try {
        await sendEmail({ userId: ctx.userId, to, subject, body })
        await db.insert(emailThreads).values({
          matterId: ctx.matterId,
          userId: ctx.userId,
          direction: "outbound",
          fromAddress: ctx.userEmail,
          toAddress: to,
          subject,
          bodyText: body,
        })
        return JSON.stringify({ sent: true, to, subject })
      } catch (err) {
        return JSON.stringify({ error: err instanceof Error ? err.message : "Failed to send email" })
      }
    }

    case "analyze_document": {
      const text = args.document_text as string
      if (!text || text.length < 50) return JSON.stringify({ error: "Document text too short to analyze" })
      return JSON.stringify({
        message: "Document analysis queued. Use the dedicated CD/commitment/HOA tools in the sidebar for full analysis with detailed reports.",
        text_length: text.length,
        detected_type: args.document_type || "unknown",
      })
    }

    case "verify_wire": {
      return JSON.stringify({
        message: "Wire verification queued. Use the dedicated Wire Verification tool in the sidebar for a complete fraud-detection report.",
        bank: args.bank_name,
        routing: args.routing_number,
      })
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}
