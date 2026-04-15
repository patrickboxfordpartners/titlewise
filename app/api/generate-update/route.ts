import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic, buildStatusUpdatePrompt } from "@/lib/anthropic"
import { db } from "@/lib/db"
import { statusUpdates } from "@/lib/db/schema"
import { getOrCreateUser, checkSubscriptionAccess, incrementUsage } from "@/lib/db/get-user"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase"] as const
const CLOSING_STAGES = [
  "Contract Signed",
  "Title Search Ordered",
  "Title Search Received",
  "Lender Conditions Outstanding",
  "Clear to Close",
  "Closing Scheduled",
  "Closing Completed",
  "Post-Closing",
] as const

const requestSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
  transactionType: z.enum(TRANSACTION_TYPES),
  closingStage: z.enum(CLOSING_STAGES),
  completedItems: z.string().optional().default(""),
  outstandingItems: z.string().optional().default(""),
  upcomingDeadlines: z.string().optional().default(""),
  additionalNotes: z.string().optional().default(""),
  attorneyName: z.string().min(1, "Attorney name is required"),
  tone: z.enum(["professional", "semi-formal"]).optional().default("professional"),
  stream: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { allowed } = checkRateLimit(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  // Subscription check
  const user = await getOrCreateUser(userId)
  const access = await checkSubscriptionAccess(user)
  if (!access.allowed) {
    return NextResponse.json({ error: access.message }, { status: 403 })
  }

  const prompt = buildStatusUpdatePrompt(parsed.data)

  // Streaming mode
  if (parsed.data.stream) {
    try {
      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      })

      let fullText = ""
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                fullText += event.delta.text
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            controller.close()

            // Persist + increment usage after stream completes
            try {
              await db.insert(statusUpdates).values({
                userId: user.id,
                clientName: parsed.data.clientName,
                propertyAddress: parsed.data.propertyAddress,
                transactionType: parsed.data.transactionType,
                closingStage: parsed.data.closingStage,
                completedItems: parsed.data.completedItems || null,
                outstandingItems: parsed.data.outstandingItems || null,
                upcomingDeadlines: parsed.data.upcomingDeadlines || null,
                additionalNotes: parsed.data.additionalNotes || null,
                tone: parsed.data.tone,
                generatedEmail: fullText,
              })
              await incrementUsage(user.id)
            } catch (dbErr) {
              logger.error("generate-update", "DB write failed", { error: String(dbErr) })
            }
          } catch (err) {
            logger.error("generate-update", "Stream error", { error: String(err) })
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } catch (err) {
      logger.error("generate-update", "Anthropic stream error", { error: String(err) })
      return NextResponse.json({ error: "Failed to generate update. Please try again." }, { status: 502 })
    }
  }

  // Non-streaming mode
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const textBlock = message.content.find((block) => block.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated. Please try again." }, { status: 502 })
    }

    // Persist + increment usage
    try {
      await db.insert(statusUpdates).values({
        userId: user.id,
        clientName: parsed.data.clientName,
        propertyAddress: parsed.data.propertyAddress,
        transactionType: parsed.data.transactionType,
        closingStage: parsed.data.closingStage,
        completedItems: parsed.data.completedItems || null,
        outstandingItems: parsed.data.outstandingItems || null,
        upcomingDeadlines: parsed.data.upcomingDeadlines || null,
        additionalNotes: parsed.data.additionalNotes || null,
        tone: parsed.data.tone,
        generatedEmail: textBlock.text,
      })
      await incrementUsage(user.id)
    } catch (dbErr) {
      logger.error("generate-update", "DB write failed", { error: String(dbErr) })
    }

    return NextResponse.json({ email: textBlock.text })
  } catch (err) {
    logger.error("generate-update", "Anthropic API error", { error: String(err) })
    const msg = err instanceof Error ? err.message : "Unknown error"
    if (msg.includes("rate_limit") || msg.includes("429")) {
      return NextResponse.json({ error: "AI service is busy. Please try again in a moment." }, { status: 429 })
    }
    return NextResponse.json({ error: "Failed to generate update. Please try again." }, { status: 502 })
  }
}
