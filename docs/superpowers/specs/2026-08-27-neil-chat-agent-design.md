# Neil — Matter Workspace Chat Agent

## Overview

Neil is a docked chat copilot embedded in the TitleWise matter workspace. He helps closing attorneys manage matters by reading state, analyzing documents, taking actions, and drafting communications — all within the context of the current deal.

**Stack:** Persona (VanillaJS widget) + Next.js SSE route + AIsa gateway (model routing) + Neon PostgreSQL

**Replaces:** Intercom Fin (generic support bot with no matter context)

## Architecture

```
Matter Detail Page (/matters/[id])
├── Existing workspace UI (checklist, docs, parties, emails)
└── Neil (Persona widget, docked right panel, collapsible)
        │
        │ SSE connection
        ▼
    /api/chat/stream (Next.js route handler)
        │
        ├── Clerk auth check
        ├── Load matter context from Neon
        ├── Build system prompt with tools
        ├── Call AIsa (streams to Claude/etc.)
        ├── Execute tool calls server-side
        ├── Stream tokens back via SSE
        └── Persist messages to chat_messages table
```

## Data Model

One new table:

```sql
CREATE TABLE chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id),
  role        text NOT NULL,       -- 'user' | 'assistant' | 'tool'
  content     text,                -- message text (nullable for tool-call-only messages)
  tool_calls  jsonb,               -- [{name, arguments, result}]
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_messages_matter ON chat_messages(matter_id, created_at);
```

- One continuous thread per matter (the matter IS the conversation)
- No separate sessions/threads table
- Last 50 messages loaded as context per request
- tool_calls JSONB for auditability and replay

## Tools

### Read (6)

| Tool | Description | DB Access |
|------|-------------|-----------|
| `get_matter_summary` | Address, closing date, status, parties count, checklist progress | matters, matter_parties, checklist_items |
| `get_checklist` | All items with status, assignee, due dates | checklist_items |
| `get_parties` | All parties (name, role, email, phone) | matter_parties |
| `get_documents` | Document slots — uploaded vs. missing | document_slots |
| `get_email_threads` | Recent emails on this matter | email_threads |
| `get_wire_history` | Past wire verifications (cross-matter memory) | wire_verifications (via existing verify-wire logic) |

### Write (4)

| Tool | Description | Confirmation Required |
|------|-------------|----------------------|
| `update_checklist_item` | Mark complete/incomplete, update notes | No |
| `add_party` | Add party to matter (name, role, email, phone) | No |
| `draft_status_update` | Generate status email to selected parties | Yes — shows draft, waits for "send it" |
| `send_email` | Send an approved draft via email integration | Yes — only after user confirms draft |

### Analysis (2)

| Tool | Description |
|------|-------------|
| `analyze_document` | Route document text to CD/commitment/HOA analyzer based on content |
| `verify_wire` | Run wire verification against provided instructions |

### Safety Rules

- `send_email` and `draft_status_update` always require explicit user confirmation before execution
- No destructive actions (delete party, remove document) in v1
- All tool executions logged in matter activity feed
- Agent never makes legal determinations or gives legal advice

## Backend — /api/chat/stream

**Method:** POST
**Auth:** Clerk session token (via Authorization header)
**Content-Type (response):** text/event-stream

### Request Body

```json
{
  "matterId": "uuid",
  "message": "Check the checklist and draft an update to the buyer's agent"
}
```

### SSE Event Format

```
event: token
data: {"content": "Let me check"}

event: token  
data: {"content": " the checklist..."}

event: tool_start
data: {"name": "get_checklist", "id": "call_123"}

event: tool_result
data: {"id": "call_123", "summary": "12/15 items complete"}

event: token
data: {"content": "You're at 80% completion..."}

event: done
data: {}

event: error
data: {"message": "Something went wrong. Try again."}
```

### Internal Flow

1. Authenticate via Clerk — 401 if no session
2. Verify user has access to this matter (ownership or team membership)
3. Load last 50 messages from `chat_messages`
4. Load fresh matter context (summary, parties, checklist snapshot)
5. Build system prompt + inject matter context
6. Call AIsa chat completions API (streaming, with tool definitions)
7. Stream tokens to client as SSE events
8. On tool_call from model: execute server-side, return result to model, continue streaming
9. On stream complete: persist user message + assistant response to `chat_messages`

### Error Handling

- AIsa timeout/5xx → `event: error` with friendly message, don't crash stream
- Tool execution failure → return error to model as tool result, let Neil explain
- Auth failure → 401 JSON response before SSE starts
- Matter not found / no access → 403

## Frontend — Persona Widget

### Installation

```bash
npm install persona-chat
```

### Component

```tsx
// components/MatterChat.tsx ("use client")
// Mounts Persona in docked layout
// Passes Clerk token via async headers callback
// Passes matterId in request body
// Themed to match TitleWise (blue: #2563eb, radius: 8px)
// Placeholder: "Ask Neil about this matter..."
```

### Layout

- Docked right-side panel within the matter detail view
- Collapsible via toggle button in the matter toolbar
- Persists open/closed state in localStorage
- Does NOT appear outside matter pages

### Persona Config

- Layout: `docked`
- Transport: `sse`
- Endpoint: `/api/chat/stream`
- Headers: Clerk Bearer token (async)
- Body: `{ matterId }`
- Theme: TitleWise blue, 8px radius

## System Prompt

```
You are Neil, a closing assistant embedded in a real estate matter workspace.

## Current Matter
- Property: {address}
- Closing date: {date}
- Status: {status}
- Parties: {parties list}
- Checklist: {X}/{Y} items complete

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
```

### Personality

- Speaks like a sharp paralegal who's been at the firm for years
- Brief, precise, no filler
- Example output: "3 items blocking clear-to-close: missing payoff statement, HOA cert not received, survey expires Friday."
- NOT: "I'd be happy to help you review your checklist! Here's what I found..."

### Confirmation Pattern

```
User: "Send the buyer's agent an update"
Neil: "Draft to Sarah Chen (buyer's agent):

  Subject: 142 Maple St — Status Update

  Hi Sarah, quick update on the Martinez closing:
  - Title commitment received and reviewed (2 standard exceptions)  
  - Lender docs expected Thursday
  - On track for 9/3 closing

  Best, [attorney name]

Send this?"
User: "yes"
Neil: "Sent."
```

## AIsa Integration

- Endpoint: AIsa chat completions API (OpenAI-compatible)
- Auth: AIsa API key (`sk-aisa-...`) stored in env as `AISA_API_KEY`
- Model: `anthropic/claude-sonnet-5` (or let AIsa route)
- Streaming: `stream: true`
- Tools: OpenAI function-calling format
- Context window: managed by loading last 50 messages + fresh matter state

## Scope Boundaries

### In Scope (v1)
- Docked chat panel in matter workspace
- 12 tools (6 read, 4 write, 2 analysis)
- SSE streaming with tool execution
- Message persistence per matter
- Confirmation gate on outbound actions

### Out of Scope (future)
- Voice input
- File upload directly in chat (use existing document upload flow)
- Global widget outside matter pages
- Multi-matter queries ("show me all matters closing this week")
- Proactive notifications from Neil (e.g., "closing is tomorrow, 2 items still open")
- Mobile-specific layout
