import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { sendEmail } from "@/lib/email/send"
import { getOrCreateUser } from "@/lib/db/get-user"

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(998),
  body: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  const user = await getOrCreateUser(userId)

  try {
    await sendEmail({ userId: user.id, ...parsed.data })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    )
  }
}
