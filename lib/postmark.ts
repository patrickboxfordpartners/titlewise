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
