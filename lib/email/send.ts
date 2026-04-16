import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getGmailAccessToken, sendViaGmail } from "./gmail"
import { getOutlookAccessToken, sendViaOutlook } from "./outlook"

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

  throw new Error("No email account connected")
}
