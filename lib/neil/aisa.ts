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

export async function* streamChat(
  messages: AisaMessage[],
  tools: AisaTool[],
): AsyncGenerator<StreamChunk> {
  const res = await fetch("https://api.aisa.one/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AISA_API_KEY}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-5",
      messages,
      tools,
      stream: true,
    }),
  })

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
