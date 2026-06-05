import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, emailThreads } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"
import { postmark, POSTMARK_FROM_EMAIL } from "@/lib/postmark"

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

function matterInboxAddress(matterId: string): string {
  return `matter-${matterId.slice(0, 8)}@titlewise.app`
}

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return { matter: matter ?? null, user }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const { matter } = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const emails = await db.select().from(emailThreads)
    .where(eq(emailThreads.matterId, matterId))
    .orderBy(asc(emailThreads.createdAt))

  const inboxAddress = matterInboxAddress(matterId)
  return NextResponse.json({ emails, inboxAddress })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const { matter, user } = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const inboxAddress = matterInboxAddress(matterId)
  const fromName = user.name ? `${user.name} via TitleWise` : "TitleWise"

  const result = await postmark.sendEmail({
    From: `${fromName} <${POSTMARK_FROM_EMAIL}>`,
    To: parsed.data.to,
    ReplyTo: inboxAddress,
    Subject: parsed.data.subject,
    TextBody: parsed.data.body,
    MessageStream: "outbound",
  })

  await db.insert(emailThreads).values({
    matterId,
    userId: user.id,
    direction: "outbound",
    fromAddress: POSTMARK_FROM_EMAIL,
    toAddress: parsed.data.to,
    subject: parsed.data.subject,
    bodyText: parsed.data.body,
    bodyHtml: null,
    messageId: result.MessageID ?? null,
    inReplyTo: null,
  })

  return NextResponse.json({ ok: true, fromAddress: POSTMARK_FROM_EMAIL })
}
