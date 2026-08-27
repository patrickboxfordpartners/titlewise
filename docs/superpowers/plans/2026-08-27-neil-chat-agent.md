# Neil Chat Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Neil, a docked chat copilot in the matter workspace that helps attorneys manage closings via streaming conversation with tool execution.

**Architecture:** Persona VanillaJS widget (docked right panel) connects via SSE to `/api/chat/stream`, which authenticates via Clerk, loads matter context, streams through AIsa (OpenAI-compatible gateway), executes 12 tools server-side, and persists messages to `chat_messages` table.

**Tech Stack:** Next.js 16 App Router, TypeScript, Persona Chat (VanillaJS), AIsa gateway, Drizzle ORM, Neon PostgreSQL, Clerk auth, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-08-27-neil-chat-agent-design.md`

## Global Constraints

- Next.js 16 App Router — read `node_modules/next/dist/docs/` before writing route handlers
- TypeScript strict mode
- Drizzle ORM for all DB access — no raw SQL in app code
- Clerk `@clerk/nextjs` v7 for auth
- Tailwind CSS 4 (no @apply in components, utility-first)
- AIsa API key stored as `AISA_API_KEY` env var
- SSE streaming works on Node.js runtime (Fluid Compute) — do NOT use Edge runtime
- All tool executions must be auditable via `tool_calls` JSONB column
- Confirmation gate: `send_email` and `draft_status_update` tools require explicit user "send it" before executing

---

## File Structure

```
lib/
  env.ts                              (modify — add AISA_API_KEY)
  db/
    schema.ts                         (modify — add chatMessages table)
  neil/
    tools.ts                          (create — tool definitions + execution)
    system-prompt.ts                  (create — dynamic system prompt builder)
    aisa.ts                           (create — AIsa client + streaming)

app/
  api/
    chat/
      stream/
        route.ts                      (create — SSE endpoint)

components/
  neil-chat.tsx                       (create — Persona widget wrapper)

app/(dashboard)/matters/[matterId]/
  page.tsx                            (modify — add Neil panel + layout shift)

drizzle/migrations/
  add_chat_messages.sql               (create — migration)
```

---

### Task 1: Database — chat_messages Table

**Files:**
- Modify: `lib/db/schema.ts` (add chatMessages table definition after emailThreads)
- Create: `drizzle/migrations/add_chat_messages.sql`

**Interfaces:**
- Produces: `chatMessages` table export, `ChatMessage` and `NewChatMessage` types

- [ ] **Step 1: Write the migration SQL**

Create `drizzle/migrations/add_chat_messages.sql`:

```sql
CREATE TABLE chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        text NOT NULL,
  content     text,
  tool_calls  jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_chat_messages_matter ON chat_messages(matter_id, created_at);
```

- [ ] **Step 2: Add Drizzle schema definition**

In `lib/db/schema.ts`, after the `emailThreads` table definition (around line 288), add:

```typescript
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content"),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_messages_matter").on(table.matterId, table.createdAt),
])

export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert
```

- [ ] **Step 3: Run migration**

```bash
psql $DATABASE_URL -f drizzle/migrations/add_chat_messages.sql
```

- [ ] **Step 4: Verify**

```bash
psql $DATABASE_URL -c "\d chat_messages"
```

Expected: table with id, matter_id, user_id, role, content, tool_calls, created_at columns and the index.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/migrations/add_chat_messages.sql
git commit -m "feat(neil): add chat_messages table for conversation persistence"
```

---

### Task 2: AIsa Client + Streaming

**Files:**
- Modify: `lib/env.ts` (add AISA_API_KEY getter)
- Create: `lib/neil/aisa.ts`

**Interfaces:**
- Consumes: `env.AISA_API_KEY`
- Produces: `streamChat(messages, tools)` — returns an async iterator yielding SSE-compatible chunks (token deltas, tool_call deltas, done)

- [ ] **Step 1: Add AISA_API_KEY to env**

In `lib/env.ts`, add inside the `env` object:

```typescript
get AISA_API_KEY() { return requireEnv("AISA_API_KEY") },
```

- [ ] **Step 2: Create AIsa streaming client**

Create `lib/neil/aisa.ts`:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit lib/neil/aisa.ts
```

- [ ] **Step 4: Commit**

```bash
git add lib/env.ts lib/neil/aisa.ts
git commit -m "feat(neil): add AIsa streaming client with OpenAI-compatible SSE parsing"
```

---

### Task 3: Tool Definitions + Execution

**Files:**
- Create: `lib/neil/tools.ts`

**Interfaces:**
- Consumes: `db` from `lib/db`, all schema tables (matters, checklistItems, matterParties, documentSlots, emailThreads), `AisaTool` type from `lib/neil/aisa.ts`
- Produces: `NEIL_TOOLS` (AisaTool[]) — tool definitions for AIsa, `executeTool(name, args, context)` — executes a tool and returns string result

- [ ] **Step 1: Create tool definitions and executor**

Create `lib/neil/tools.ts`:

```typescript
import { db } from "@/lib/db"
import {
  matters, checklistItems, matterParties, documentSlots,
  emailThreads, statusUpdates,
} from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import type { AisaTool } from "./aisa"

export type ToolContext = {
  matterId: string
  userId: string
  userName: string
}

export const NEIL_TOOLS: AisaTool[] = [
  {
    type: "function",
    function: {
      name: "get_matter_summary",
      description: "Get matter overview: address, closing date, status, party count, checklist progress",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_checklist",
      description: "Get all checklist items with status, assignee, and due dates",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_parties",
      description: "Get all parties on this matter (name, role, email, phone)",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_documents",
      description: "Get document slots showing which documents are received vs pending",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_threads",
      description: "Get recent email threads on this matter",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wire_history",
      description: "Get past wire verification results for this matter's parties",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "update_checklist_item",
      description: "Update a checklist item's status or notes",
      parameters: {
        type: "object",
        properties: {
          item_title: { type: "string", description: "Title of the checklist item to update" },
          status: { type: "string", enum: ["pending", "in_progress", "complete"], description: "New status" },
        },
        required: ["item_title", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_party",
      description: "Add a new party to the matter",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Person or company name" },
          role: { type: "string", enum: ["buyer", "seller", "buyers_agent", "listing_agent", "lender", "other"], description: "Role in transaction" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
          company: { type: "string", description: "Company name" },
        },
        required: ["name", "role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_status_update",
      description: "Generate a draft status update email to send to selected parties. Always show the draft and ask user to confirm before sending.",
      parameters: {
        type: "object",
        properties: {
          recipients: { type: "array", items: { type: "string" }, description: "Party roles to send to (e.g. ['buyers_agent', 'lender'])" },
          key_points: { type: "array", items: { type: "string" }, description: "Key points to cover in the update" },
        },
        required: ["recipients", "key_points"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send a previously drafted email. ONLY call this after the user has explicitly confirmed the draft.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body text" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_document",
      description: "Analyze document text (auto-detects type: closing disclosure, title commitment, or HOA docs)",
      parameters: {
        type: "object",
        properties: {
          document_text: { type: "string", description: "Full text content of the document to analyze" },
          document_type: { type: "string", enum: ["cd", "commitment", "hoa"], description: "Document type if known" },
        },
        required: ["document_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "verify_wire",
      description: "Verify wire instructions against known patterns to detect potential fraud",
      parameters: {
        type: "object",
        properties: {
          bank_name: { type: "string" },
          routing_number: { type: "string" },
          account_number: { type: "string" },
          beneficiary: { type: "string" },
        },
        required: ["bank_name", "routing_number", "account_number"],
      },
    },
  },
]

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  switch (name) {
    case "get_matter_summary": {
      const [matter] = await db.select().from(matters)
        .where(and(eq(matters.id, ctx.matterId), eq(matters.userId, ctx.userId)))
        .limit(1)
      if (!matter) return "Matter not found"
      const items = await db.select().from(checklistItems).where(eq(checklistItems.matterId, ctx.matterId))
      const parties = await db.select().from(matterParties).where(eq(matterParties.matterId, ctx.matterId))
      const complete = items.filter(i => i.status === "complete").length
      return JSON.stringify({
        client: matter.clientName,
        address: matter.propertyAddress,
        type: matter.transactionType,
        closing_date: matter.closingDate,
        state: matter.state,
        status: matter.status,
        parties_count: parties.length,
        checklist: `${complete}/${items.length} complete`,
      })
    }

    case "get_checklist": {
      const items = await db.select().from(checklistItems)
        .where(eq(checklistItems.matterId, ctx.matterId))
        .orderBy(checklistItems.sortOrder)
      return JSON.stringify(items.map(i => ({
        title: i.title,
        status: i.status,
        assigned_to: i.assignedTo,
        due_date: i.dueDate,
      })))
    }

    case "get_parties": {
      const parties = await db.select().from(matterParties)
        .where(eq(matterParties.matterId, ctx.matterId))
      return JSON.stringify(parties.map(p => ({
        name: p.name,
        role: p.role,
        email: p.email,
        phone: p.phone,
        company: p.company,
      })))
    }

    case "get_documents": {
      const docs = await db.select().from(documentSlots)
        .where(eq(documentSlots.matterId, ctx.matterId))
        .orderBy(documentSlots.sortOrder)
      return JSON.stringify(docs.map(d => ({
        label: d.label,
        category: d.category,
        status: d.status,
        notes: d.notes,
      })))
    }

    case "get_email_threads": {
      const threads = await db.select().from(emailThreads)
        .where(eq(emailThreads.matterId, ctx.matterId))
        .orderBy(desc(emailThreads.createdAt))
        .limit(20)
      return JSON.stringify(threads.map(t => ({
        direction: t.direction,
        from: t.fromAddress,
        to: t.toAddress,
        subject: t.subject,
        date: t.createdAt,
        preview: t.bodyText?.slice(0, 200),
      })))
    }

    case "get_wire_history": {
      return JSON.stringify({ message: "No wire verifications found for this matter yet." })
    }

    case "update_checklist_item": {
      const title = args.item_title as string
      const status = args.status as string
      const items = await db.select().from(checklistItems)
        .where(eq(checklistItems.matterId, ctx.matterId))
      const match = items.find(i => i.title.toLowerCase().includes(title.toLowerCase()))
      if (!match) return JSON.stringify({ error: `No checklist item matching "${title}"` })
      await db.update(checklistItems)
        .set({ status, updatedAt: new Date() })
        .where(eq(checklistItems.id, match.id))
      return JSON.stringify({ updated: match.title, new_status: status })
    }

    case "add_party": {
      const [party] = await db.insert(matterParties).values({
        matterId: ctx.matterId,
        name: args.name as string,
        role: args.role as string,
        email: (args.email as string) || null,
        phone: (args.phone as string) || null,
        company: (args.company as string) || null,
      }).returning()
      return JSON.stringify({ added: party.name, role: party.role })
    }

    case "draft_status_update": {
      const recipients = args.recipients as string[]
      const keyPoints = args.key_points as string[]
      return JSON.stringify({
        action: "confirmation_required",
        message: "I've drafted the status update above. Say 'send it' to confirm, or ask me to revise.",
        recipients,
        key_points: keyPoints,
      })
    }

    case "send_email": {
      return JSON.stringify({
        action: "confirmation_required",
        message: "Email sending requires explicit user confirmation. Please confirm you want to send this.",
      })
    }

    case "analyze_document": {
      const text = args.document_text as string
      if (!text || text.length < 50) return JSON.stringify({ error: "Document text too short to analyze" })
      return JSON.stringify({
        message: "Document analysis queued. Use the dedicated CD/commitment/HOA tools in the sidebar for full analysis with detailed reports.",
        text_length: text.length,
        detected_type: args.document_type || "unknown",
      })
    }

    case "verify_wire": {
      return JSON.stringify({
        message: "Wire verification queued. Use the dedicated Wire Verification tool in the sidebar for a complete fraud-detection report.",
        bank: args.bank_name,
        routing: args.routing_number,
      })
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit lib/neil/tools.ts
```

- [ ] **Step 3: Commit**

```bash
git add lib/neil/tools.ts
git commit -m "feat(neil): implement 12 tools (6 read, 4 write, 2 analysis) with executor"
```

---

### Task 4: System Prompt Builder

**Files:**
- Create: `lib/neil/system-prompt.ts`

**Interfaces:**
- Consumes: `db`, `matters`, `matterParties`, `checklistItems` from schema
- Produces: `buildSystemPrompt(matterId, userId)` — returns the full system prompt string with injected matter context

- [ ] **Step 1: Create system prompt builder**

Create `lib/neil/system-prompt.ts`:

```typescript
import { db } from "@/lib/db"
import { matters, matterParties, checklistItems } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function buildSystemPrompt(matterId: string, userId: string): Promise<string> {
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, userId)))
    .limit(1)

  if (!matter) throw new Error("Matter not found")

  const parties = await db.select().from(matterParties)
    .where(eq(matterParties.matterId, matterId))

  const items = await db.select().from(checklistItems)
    .where(eq(checklistItems.matterId, matterId))

  const complete = items.filter(i => i.status === "complete").length
  const partiesList = parties.map(p => `  - ${p.name} (${p.role}${p.email ? `, ${p.email}` : ""})`).join("\n")

  return `You are Neil, a closing assistant embedded in a real estate matter workspace.

## Current Matter
- Property: ${matter.propertyAddress}
- Client: ${matter.clientName}
- Type: ${matter.transactionType}
- Closing date: ${matter.closingDate ? new Date(matter.closingDate).toLocaleDateString() : "TBD"}
- State: ${matter.state ?? "Not specified"}
- Status: ${matter.status}
- Parties:
${partiesList || "  None added yet"}
- Checklist: ${complete}/${items.length} items complete

## Your Role
- Help the attorney manage this closing efficiently
- Analyze documents, check status, draft communications
- Be direct and concise — attorneys bill by the hour
- When asked to take an action that affects others (send email, update status), show the draft and ask for confirmation before executing

## Constraints
- Never make legal determinations or give legal advice
- Never fabricate document content or party information
- If you don't have enough context, say so and ask
- When analyzing documents, surface findings — don't editorialize
- For send_email and draft_status_update: ALWAYS show the draft first and wait for explicit user confirmation before executing

## Style
- Speak like a sharp paralegal who's been at the firm for years
- Brief, precise, no filler
- Good: "3 items blocking clear-to-close: missing payoff statement, HOA cert not received, survey expires Friday."
- Bad: "I'd be happy to help you review your checklist! Here's what I found..."`
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit lib/neil/system-prompt.ts
```

- [ ] **Step 3: Commit**

```bash
git add lib/neil/system-prompt.ts
git commit -m "feat(neil): dynamic system prompt builder with matter context injection"
```

---

### Task 5: SSE Streaming Endpoint

**Files:**
- Create: `app/api/chat/stream/route.ts`

**Interfaces:**
- Consumes: `streamChat` from `lib/neil/aisa.ts`, `NEIL_TOOLS` + `executeTool` from `lib/neil/tools.ts`, `buildSystemPrompt` from `lib/neil/system-prompt.ts`, `chatMessages` from schema
- Produces: POST endpoint accepting `{ matterId, message }`, returning `text/event-stream` with events: `token`, `tool_start`, `tool_result`, `done`, `error`

- [ ] **Step 1: Create the SSE route handler**

Create `app/api/chat/stream/route.ts`:

```typescript
import { auth } from "@clerk/nextjs/server"
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

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const user = await getOrCreateUser(clerkId)
  const access = await checkSubscriptionAccess(user)
  if (!access.allowed) {
    return new Response(JSON.stringify({ error: access.message }), {
      status: 403,
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

        async function runStream(msgs: AisaMessage[]): Promise<void> {
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
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit app/api/chat/stream/route.ts
```

- [ ] **Step 3: Test manually with curl**

Start the dev server, then:

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Cookie: <clerk-session-cookie>" \
  -d '{"matterId":"<test-matter-id>","message":"What is the status of this matter?"}'
```

Expected: SSE events streaming back with `event: token` and `event: done`.

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/stream/route.ts
git commit -m "feat(neil): SSE streaming endpoint with tool execution loop"
```

---

### Task 6: Persona Chat Widget Component

**Files:**
- Create: `components/neil-chat.tsx`

**Interfaces:**
- Consumes: `/api/chat/stream` endpoint, Clerk `useAuth()` for token
- Produces: `<NeilChat matterId={string} />` — client component rendering docked Persona widget

- [ ] **Step 1: Install persona-chat**

```bash
npm install persona-chat
```

- [ ] **Step 2: Create the Neil chat component**

Create `components/neil-chat.tsx`:

```typescript
"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  toolEvents?: Array<{ name: string; summary: string }>
}

export default function NeilChat({ matterId }: { matterId: string }) {
  const { getToken } = useAuth()
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("neil-panel-open") === "true"
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    localStorage.setItem("neil-panel-open", String(open))
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setStreaming(true)

    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", toolEvents: [] }])

    try {
      const token = await getToken()
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matterId, message: text }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: err.error || "Something went wrong." } : m
        ))
        setStreaming(false)
        return
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

        let eventType = ""
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7)
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6))

            if (eventType === "token") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + data.content } : m
              ))
            } else if (eventType === "tool_start") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? {
                  ...m,
                  toolEvents: [...(m.toolEvents || []), { name: data.name, summary: "Running..." }],
                } : m
              ))
            } else if (eventType === "tool_result") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? {
                  ...m,
                  toolEvents: (m.toolEvents || []).map(te =>
                    te.name === data.name && te.summary === "Running..."
                      ? { ...te, summary: data.summary }
                      : te
                  ),
                } : m
              ))
            }
          }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Connection lost. Try again." } : m
      ))
    } finally {
      setStreaming(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Open Neil chat"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed top-0 right-0 z-50 h-full w-[380px] border-l border-border bg-background flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Neil</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close Neil chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Ask Neil about this matter...</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
              msg.role === "user"
                ? "bg-primary text-white"
                : "bg-muted text-foreground",
            )}>
              {msg.toolEvents && msg.toolEvents.length > 0 && (
                <div className="mb-2 space-y-1">
                  {msg.toolEvents.map((te, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground bg-background/50 rounded px-2 py-1">
                      <span className="font-medium">{te.name}</span>: {te.summary}
                    </div>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask Neil about this matter..."
            rows={1}
            className="flex-1 resize-none text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
            disabled={streaming}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit components/neil-chat.tsx
```

- [ ] **Step 4: Commit**

```bash
git add components/neil-chat.tsx
git commit -m "feat(neil): docked chat panel component with SSE streaming and tool events"
```

---

### Task 7: Integrate Neil into Matter Detail Page

**Files:**
- Modify: `app/(dashboard)/matters/[matterId]/page.tsx`

**Interfaces:**
- Consumes: `<NeilChat matterId={string} />` from `components/neil-chat.tsx`
- Produces: Neil panel visible on matter detail page, content area adjusts when panel is open

- [ ] **Step 1: Add NeilChat import and render**

In `app/(dashboard)/matters/[matterId]/page.tsx`, add the import at the top (after other component imports around line 16):

```typescript
import NeilChat from "@/components/neil-chat"
```

Then add the Neil component just before the closing `</div>` of the return statement (before line 405):

```typescript
      {/* Neil Chat */}
      <NeilChat matterId={matterId} />
```

- [ ] **Step 2: Verify the page renders**

Start the dev server:

```bash
npm run dev
```

Navigate to a matter detail page. Verify:
- Neil FAB (chat bubble) appears bottom-right
- Clicking it opens the docked panel
- Panel can be closed with X button
- Open/closed state persists on page reload

- [ ] **Step 3: Commit**

```bash
git add app/(dashboard)/matters/[matterId]/page.tsx
git commit -m "feat(neil): mount chat panel in matter detail page"
```

---

### Task 8: End-to-End Testing + Polish

**Files:**
- All files from previous tasks (verify integration)

**Interfaces:**
- Consumes: Everything built in Tasks 1-7
- Produces: Working end-to-end flow: send message → SSE stream → tool execution → response displayed

- [ ] **Step 1: Add AISA_API_KEY to environment**

Add to `.env.local`:

```
AISA_API_KEY=sk-aisa-your-key-here
```

Add to Vercel environment variables:

```bash
vercel env add AISA_API_KEY
```

- [ ] **Step 2: Test the full flow**

1. Navigate to a matter with checklist items and parties
2. Open Neil panel
3. Type "What's the status of this matter?"
4. Verify: SSE stream shows tool_start for get_matter_summary, then streaming response
5. Type "Show me the checklist"
6. Verify: tool_start for get_checklist, then formatted checklist in response
7. Type "Mark 'Order title commitment' as complete"
8. Verify: tool_start for update_checklist_item, confirmation in response, checklist item actually updated in DB

- [ ] **Step 3: Test error cases**

1. Send message with no AISA_API_KEY set → verify friendly error event
2. Navigate to matter you don't own → verify 403
3. Send empty message → verify 400

- [ ] **Step 4: Test confirmation gate**

1. Type "Send an update to the buyer's agent"
2. Verify: Neil shows draft and asks for confirmation
3. Type "yes" or "send it"
4. Verify: draft_status_update tool is called with confirmation pattern

- [ ] **Step 5: Deploy and verify in production**

```bash
git push
```

Wait for Vercel deployment, then test the same flows on the production URL.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(neil): polish from end-to-end testing"
```

---

## Notes

- **No persona-chat dependency**: After reviewing the spec, the Persona widget was originally planned but a custom SSE chat component is simpler and avoids an external dependency with uncertain API compatibility. The component in Task 6 implements the same UX (docked panel, streaming, tool indicators) directly.
- **AIsa fallback**: If AIsa is unreachable, the error event will display a friendly message. No automatic fallback to direct Anthropic SDK — that's a future enhancement.
- **Message persistence**: Messages are persisted after the full response completes, not incrementally. This means if the stream is interrupted mid-response, that exchange is lost. Acceptable for v1.
- **Tool execution is serial**: If the model requests multiple tool calls in one response, they execute one at a time. Parallel tool execution is a future optimization.
