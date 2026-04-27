import { ServerClient } from "postmark"

if (!process.env.POSTMARK_API_KEY) {
  throw new Error("POSTMARK_API_KEY is required")
}

export const postmark = new ServerClient(process.env.POSTMARK_API_KEY)

export const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "hello@titlewise.app"
