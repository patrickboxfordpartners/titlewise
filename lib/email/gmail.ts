import { decryptToken } from "./crypto"

export async function getGmailAccessToken(encryptedRefreshToken: string): Promise<string> {
  const refreshToken = decryptToken(encryptedRefreshToken)
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  const data = await res.json() as { access_token?: string; error_description?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? "Failed to refresh Google access token")
  }
  return data.access_token
}

function buildMimeMessage({ to, subject, body }: { to: string; subject: string; body: string }): string {
  const raw = [
    `MIME-Version: 1.0`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body,
  ].join("\r\n")
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function sendViaGmail({
  accessToken,
  to,
  subject,
  body,
}: {
  accessToken: string
  to: string
  subject: string
  body: string
}): Promise<void> {
  const raw = buildMimeMessage({ to, subject, body })
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  })
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } }
    throw new Error(err.error?.message ?? "Gmail send failed")
  }
}
