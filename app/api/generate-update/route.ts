import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { anthropic, buildStatusUpdatePrompt } from "@/lib/anthropic"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    clientName,
    propertyAddress,
    transactionType,
    closingStage,
    completedItems,
    outstandingItems,
    upcomingDeadlines,
    additionalNotes,
    attorneyName,
    tone,
  } = body

  if (!clientName || !propertyAddress || !attorneyName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const prompt = buildStatusUpdatePrompt({
    clientName,
    propertyAddress,
    transactionType,
    closingStage,
    completedItems: completedItems || "",
    outstandingItems: outstandingItems || "",
    upcomingDeadlines: upcomingDeadlines || "",
    additionalNotes: additionalNotes || "",
    attorneyName,
    tone: tone || "professional",
  })

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const email = message.content[0].type === "text" ? message.content[0].text : ""

  return NextResponse.json({ email })
}
