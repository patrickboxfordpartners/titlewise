import { decryptToken } from "./crypto"

export async function getOutlookAccessToken(encryptedRefreshToken: string): Promise<string> {
  const refreshToken = decryptToken(encryptedRefreshToken)
  const tenant = process.env.MICROSOFT_TENANT_ID ?? "common"
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "Mail.Send offline_access",
    }),
  })
  const data = await res.json() as { access_token?: string; error_description?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? "Failed to refresh Microsoft access token")
  }
  return data.access_token
}

export async function sendViaOutlook({
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
  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "Text", content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  })
  // Graph returns 202 Accepted on success
  if (!res.ok && res.status !== 202) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? "Outlook send failed")
  }
}
