import { ServerClient } from "postmark"

let _postmarkClient: ServerClient | null = null

function getPostmarkClient(): ServerClient {
  if (_postmarkClient) {
    return _postmarkClient
  }

  if (!process.env.POSTMARK_API_KEY) {
    throw new Error("POSTMARK_API_KEY is required")
  }

  _postmarkClient = new ServerClient(process.env.POSTMARK_API_KEY)
  return _postmarkClient
}

export const postmark = {
  sendEmail: (...args: Parameters<ServerClient["sendEmail"]>) => {
    return getPostmarkClient().sendEmail(...args)
  }
}

export const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "hello@titlewise.app"

export type SignupAlertInput = {
  kind: string
  email: string
  name?: string | null
  details?: Record<string, string | null | undefined>
}

/**
 * Best-effort internal alert for new signups/leads. Never throws, never blocks
 * longer than 5s, and no-ops when POSTMARK_API_KEY is unset.
 */
export async function notifySignup({ kind, email, name, details }: SignupAlertInput): Promise<void> {
  try {
    if (!process.env.POSTMARK_API_KEY) return

    const to = process.env.SIGNUP_ALERT_TO ?? "patrick@boxfordpartners.com"
    const lines = [
      "App: TITLEwise",
      `Kind: ${kind}`,
      `Email: ${email}`,
      `Name: ${name || "Not provided"}`,
      `Time: ${new Date().toISOString()}`,
    ]
    for (const [key, value] of Object.entries(details ?? {})) {
      if (value) lines.push(`${key}: ${value}`)
    }

    const signal = AbortSignal.timeout(5000)
    const timeout = new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("notifySignup timed out")), { once: true })
    })

    await Promise.race([
      postmark.sendEmail({
        From: POSTMARK_FROM_EMAIL,
        To: to,
        Subject: `[TITLEwise] New ${kind}: ${email}`,
        TextBody: lines.join("\n"),
        MessageStream: "outbound",
      }),
      timeout,
    ])
  } catch (error) {
    console.error("notifySignup failed:", error)
  }
}
