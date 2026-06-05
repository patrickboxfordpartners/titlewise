import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matters, emailThreads } from "@/lib/db/schema"
import { eq, like } from "drizzle-orm"

// Postmark inbound payload shape (partial — only fields we use)
type PostmarkInbound = {
  From: string
  FromFull: { Email: string; Name: string }
  ToFull: { Email: string; Name: string }[]
  Subject: string
  TextBody: string | null
  HtmlBody: string | null
  MessageID: string
  ReplyTo: string | null
  InReplyTo: string | null
  Headers: { Name: string; Value: string }[]
}

function extractShortId(toEmail: string): string | null {
  // Matches matter-{8chars}@titlewise.app
  const match = toEmail.match(/^matter-([a-f0-9-]{8,}?)@/i)
  return match ? match[1].slice(0, 8) : null
}

export async function POST(req: NextRequest) {
  // Verify secret if configured
  const secret = process.env.POSTMARK_INBOUND_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get("x-postmark-signature")
    if (sig !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  let payload: PostmarkInbound
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const toEmail = payload.ToFull?.[0]?.Email ?? ""
  const shortId = extractShortId(toEmail)

  if (!shortId) {
    // Not a matter address — ignore
    return NextResponse.json({ ok: true })
  }

  // Find matter by first 8 chars of UUID
  const [matter] = await db.select()
    .from(matters)
    .where(like(matters.id, `${shortId}%`))
    .limit(1)

  if (!matter) {
    // No matching matter — accept and discard (don't let Postmark retry)
    return NextResponse.json({ ok: true })
  }

  // Dedup by messageId
  if (payload.MessageID) {
    const existing = await db.select({ id: emailThreads.id })
      .from(emailThreads)
      .where(eq(emailThreads.messageId, payload.MessageID))
      .limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ ok: true })
    }
  }

  await db.insert(emailThreads).values({
    matterId: matter.id,
    userId: matter.userId,
    direction: "inbound",
    fromAddress: payload.From,
    toAddress: toEmail,
    subject: payload.Subject ?? "(no subject)",
    bodyText: payload.TextBody ?? null,
    bodyHtml: payload.HtmlBody ?? null,
    messageId: payload.MessageID ?? null,
    inReplyTo: payload.InReplyTo ?? null,
  })

  return NextResponse.json({ ok: true })
}
