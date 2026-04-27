import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contactSubmissions } from "@/lib/db/schema"
import { postmark, POSTMARK_FROM_EMAIL } from "@/lib/postmark"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  firm: z.string().trim().max(150).optional(),
  message: z.string().trim().min(1).max(1000),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, email, firm, message } = parsed.data

    // Store in database
    await db.insert(contactSubmissions).values({
      name,
      email,
      firmName: firm || null,
      message,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      userAgent: req.headers.get("user-agent") || null,
    })

    // Send email notification to hello@titlewise.app
    const emailBody = `
New demo request from TitleWise website:

Name: ${name}
Email: ${email}
Firm: ${firm || "Not provided"}

Message:
${message}

---
Submitted: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}
IP: ${req.headers.get("x-forwarded-for") || "unknown"}
`.trim()

    await postmark.sendEmail({
      From: POSTMARK_FROM_EMAIL,
      To: "hello@titlewise.app,patrick@titlewise.app",
      Subject: `Demo Request from ${name} ${firm ? `(${firm})` : ""}`,
      TextBody: emailBody,
      MessageStream: "outbound",
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Contact form error:", err)
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    )
  }
}
