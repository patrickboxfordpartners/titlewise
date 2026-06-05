import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getGmailAccessToken, sendViaGmail } from "./gmail"
import { getOutlookAccessToken, sendViaOutlook } from "./outlook"
import { postmark, POSTMARK_FROM_EMAIL } from "@/lib/postmark"

export async function sendEmail({
  userId,
  to,
  subject,
  body,
}: {
  userId: string
  to: string
  subject: string
  body: string
}): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new Error("User not found")

  if (user.googleRefreshToken) {
    const accessToken = await getGmailAccessToken(user.googleRefreshToken)
    await sendViaGmail({ accessToken, to, subject, body })
    return
  }

  if (user.outlookRefreshToken) {
    const accessToken = await getOutlookAccessToken(user.outlookRefreshToken)
    await sendViaOutlook({ accessToken, to, subject, body })
    return
  }

  // Fallback: send via Postmark from hello@titlewise.app
  // Reply-To is set to user's email so replies come back to them
  await postmark.sendEmail({
    From: POSTMARK_FROM_EMAIL,
    To: to,
    ReplyTo: user.email,
    Subject: subject,
    TextBody: body,
    MessageStream: "outbound",
  })
}
