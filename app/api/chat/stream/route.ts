import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { chatMessages, matters } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getOrCreateUser, checkSubscriptionAccess } from "@/lib/db/get-user"
import { buildSystemPrompt } from "@/lib/neil/system-prompt"
import { streamChat, type AisaMessage, type AisaToolCall } from "@/lib/neil/aisa"
import { NEIL_TOOLS, executeTool, type ToolContext } from "@/lib/neil/tools"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(userId) || []
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  rateLimitMap.set(userId, recent)
  return true
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
    const user = await getOrCreateUser(userId)
  const access = await checkSubscriptionAccess(user)
  if (!access.allowed) {
    return new Response(JSON.stringify({ error: access.message }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!checkRateLimit(user.id)) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again in a minute." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { matterId, message } = await req.json()
  if (!matterId || !message) {
    return new Response(JSON.stringify({ error: "matterId and message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)

  if (!matter) {
    return new Response(JSON.stringify({ error: "Matter not found" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const systemPrompt = await buildSystemPrompt(matterId, user.id)

  const history = await db.select().from(chatMessages)
    .where(eq(chatMessages.matterId, matterId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50)

  const historyMessages: AisaMessage[] = history.reverse().flatMap(msg => {
    const base: AisaMessage = { role: msg.role as AisaMessage["role"], content: msg.content }
    if (msg.role === "assistant" && msg.toolCalls) {
      base.tool_calls = msg.toolCalls as AisaToolCall[]
    }
    return [base]
  })

  const messages: AisaMessage[] = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: message },
  ]

  const toolCtx: ToolContext = {
    matterId,
    userId: user.id,
    userName: user.name ?? "Attorney",
    userEmail: user.email,
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        let fullContent = ""
        let toolCallsAccumulator: Array<{ id: string; name: string; arguments: string }> = []
        let currentToolArgs: Record<string, string> = {}
        let depth = 0

        async function runStream(msgs: AisaMessage[]): Promise<void> {
          if (++depth > 10) {
            send("error", { message: "Too many tool iterations. Try a simpler request." })
            return
          }
          const chunks = streamChat(msgs, NEIL_TOOLS)

          for await (const chunk of chunks) {
            switch (chunk.type) {
              case "token":
                fullContent += chunk.content
                send("token", { content: chunk.content })
                break

              case "tool_call_start":
                currentToolArgs[chunk.id] = ""
                toolCallsAccumulator.push({ id: chunk.id, name: chunk.name, arguments: "" })
                send("tool_start", { name: chunk.name, id: chunk.id })
                break

              case "tool_call_args":
                currentToolArgs[chunk.id] = (currentToolArgs[chunk.id] || "") + chunk.args
                break

              case "tool_call_end": {
                const tc = toolCallsAccumulator.find(t => t.id === chunk.id)
                if (tc) tc.arguments = currentToolArgs[chunk.id] || ""
                break
              }

              case "done":
                break
            }
          }

          if (toolCallsAccumulator.length > 0) {
            const toolResults: AisaMessage[] = []

            for (const tc of toolCallsAccumulator) {
              let args: Record<string, unknown> = {}
              try { args = JSON.parse(tc.arguments) } catch {}

              const result = await executeTool(tc.name, args, toolCtx)
              send("tool_result", { id: tc.id, name: tc.name, summary: result.slice(0, 200) })

              toolResults.push({
                role: "tool",
                content: result,
                tool_call_id: tc.id,
              })
            }

            const assistantMsg: AisaMessage = {
              role: "assistant",
              content: fullContent || null,
              tool_calls: toolCallsAccumulator.map(tc => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
              })),
            }

            const continuationMessages = [...msgs, assistantMsg, ...toolResults]
            toolCallsAccumulator = []
            currentToolArgs = {}
            fullContent = ""

            await runStream(continuationMessages)
          }
        }

        await runStream(messages)

        send("done", {})

        await db.insert(chatMessages).values([
          { matterId, userId: user.id, role: "user", content: message },
          { matterId, userId: user.id, role: "assistant", content: fullContent || null, toolCalls: toolCallsAccumulator.length > 0 ? toolCallsAccumulator : null },
        ])
      } catch (err) {
        send("error", { message: "Something went wrong. Try again." })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
}
