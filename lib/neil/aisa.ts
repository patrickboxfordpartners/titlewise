import { env } from "@/lib/env"

export type AisaMessage = {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  tool_calls?: AisaToolCall[]
  tool_call_id?: string
}

export type AisaToolCall = {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

export type AisaTool = {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export type StreamChunk =
  | { type: "token"; content: string }
  | { type: "tool_call_start"; id: string; name: string }
  | { type: "tool_call_args"; id: string; args: string }
  | { type: "tool_call_end"; id: string }
  | { type: "done" }

const MAX_RETRY_AFTER_MS = 10_000

/** Parse a Retry-After header (seconds or HTTP date) into ms, or null if absent or invalid. */
function retryAfterMs(header: string | null): number | null {
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const date = Date.parse(header)
  if (Number.isNaN(date)) return null
  return Math.max(0, date - Date.now())
}

async function requestChatCompletion(body: string): Promise<Response> {
  const maxAttempts = 3
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch("https://api.aisa.one/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.AISA_API_KEY}`,
        },
        body,
      })
      if (res.ok) return res
      const retryable = res.status === 429 || res.status === 529 || res.status >= 500
      if (!retryable || attempt === maxAttempts - 1) return res
      const waitMs = res.status === 429 ? retryAfterMs(res.headers.get("retry-after")) : null
      await res.text().catch(() => undefined)
      if (waitMs !== null) {
        // Honor the server's Retry-After when it fits our budget; otherwise
        // return the 429 rather than retrying too early.
        if (waitMs > MAX_RETRY_AFTER_MS) return res
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        continue
      }
    } catch (err) {
      lastError = err
      if (attempt === maxAttempts - 1) throw err
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt))
  }
  throw lastError instanceof Error ? lastError : new Error("AIsa request failed")
}

export async function* streamChat(
  messages: AisaMessage[],
  tools: AisaTool[],
): AsyncGenerator<StreamChunk> {
  const res = await requestChatCompletion(JSON.stringify({
    model: "anthropic/claude-sonnet-5",
    messages,
    tools,
    stream: true,
  }))

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AIsa error ${res.status}: ${text}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop()!

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6)
      if (data === "[DONE]") {
        yield { type: "done" }
        return
      }

      const chunk = JSON.parse(data)
      const delta = chunk.choices?.[0]?.delta
      if (!delta) continue

      if (delta.content) {
        yield { type: "token", content: delta.content }
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.function?.name) {
            yield { type: "tool_call_start", id: tc.id, name: tc.function.name }
          }
          if (tc.function?.arguments) {
            yield { type: "tool_call_args", id: tc.id, args: tc.function.arguments }
          }
        }
      }

      if (chunk.choices?.[0]?.finish_reason === "tool_calls") {
        const toolCalls = chunk.choices[0]?.message?.tool_calls
        if (toolCalls) {
          for (const tc of toolCalls) {
            yield { type: "tool_call_end", id: tc.id }
          }
        }
      }
    }
  }
}
