import { NextRequest, NextResponse } from "next/server"
import { POST as analyzeCd } from "../v1/analyze-cd/route"
import { POST as analyzeCommitment } from "../v1/analyze-commitment/route"
import { POST as reviewHoa } from "../v1/review-hoa/route"
import { POST as verifyWire } from "../v1/verify-wire/route"

/**
 * Minimal MCP server (Streamable HTTP, JSON responses, stateless).
 * initialize / tools/list are public so agents can discover the tools.
 * tools/call requires a TITLEwise API key (Authorization: Bearer tw_live_...)
 * and is forwarded to the matching /api/v1 handler, which authenticates the
 * key, enforces plan limits and records usage exactly like a direct REST call.
 */

const PROTOCOL_VERSION = "2025-06-18"

const docInput = (min: number) => ({
  type: "object",
  properties: {
    document_text: { type: "string", minLength: min, description: "Full extracted text of the document" },
    property_address: { type: "string", description: "Optional property address for context" },
  },
  required: ["document_text"],
})

const TOOLS = [
  {
    name: "analyze_cd",
    description: "Review a Closing Disclosure for TRID compliance and cost discrepancies. Cure amounts are AI estimates; verify against the LE and CD.",
    inputSchema: docInput(100),
    handler: analyzeCd,
  },
  {
    name: "analyze_commitment",
    description: "Parse a title commitment and identify Schedule B exceptions, liens and requirements.",
    inputSchema: docInput(100),
    handler: analyzeCommitment,
  },
  {
    name: "review_hoa",
    description: "Extract key terms, fees and restrictions from HOA or condo documents.",
    inputSchema: docInput(100),
    handler: reviewHoa,
  },
  {
    name: "verify_wire",
    description: "Screen wire instructions for fraud red flags and check the ABA routing checksum. Does not verify account ownership with any outside source; always confirm by phone.",
    inputSchema: {
      type: "object",
      properties: {
        document_text: { type: "string", minLength: 50, description: "Text of the wire instructions" },
        expected_amount: { type: "number", description: "Optional expected wire amount" },
        expected_beneficiary: { type: "string", description: "Optional expected beneficiary name" },
      },
      required: ["document_text"],
    },
    handler: verifyWire,
  },
] as const

type RpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> }

const rpcResult = (id: RpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result })
const rpcError = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } })

async function handle(msg: RpcRequest, req: NextRequest) {
  switch (msg.method) {
    case "initialize":
      return rpcResult(msg.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "titlewise", version: "1.0.0" },
        instructions: "Call tools/call with Authorization: Bearer <TITLEwise API key>. Keys are created under Settings > API Keys (Enterprise plan). See https://titlewise.app/auth.md",
      })
    case "ping":
      return rpcResult(msg.id, {})
    case "tools/list":
      return rpcResult(msg.id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) })
    case "tools/call": {
      const name = String(msg.params?.name ?? "")
      const tool = TOOLS.find(t => t.name === name)
      if (!tool) return rpcError(msg.id, -32602, `Unknown tool: ${name}`)
      const auth = req.headers.get("authorization")
      if (!auth) return rpcError(msg.id, -32001, "Authentication required: send Authorization: Bearer <TITLEwise API key>")
      const inner = new NextRequest(new URL(`/api/v1/${name.replace(/_/g, "-")}`, req.url), {
        method: "POST",
        headers: { "content-type": "application/json", authorization: auth },
        body: JSON.stringify(msg.params?.arguments ?? {}),
      })
      const res = await tool.handler(inner)
      const text = await res.text()
      return rpcResult(msg.id, { content: [{ type: "text", text }], isError: !res.ok })
    }
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

export async function POST(req: NextRequest) {
  let body: RpcRequest | RpcRequest[]
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400 })
  }
  const batch = Array.isArray(body) ? body : [body]
  const requests = batch.filter(m => m && m.id !== undefined && m.id !== null)
  // Notifications only (e.g. notifications/initialized): acknowledge with 202.
  if (requests.length === 0) return new NextResponse(null, { status: 202 })
  // One failing request must not drop the others' responses.
  const results = await Promise.all(
    requests.map(m =>
      handle(m, req).catch(err => {
        console.error("[mcp] request failed", err)
        return rpcError(m.id, -32603, "Internal error")
      })
    )
  )
  return NextResponse.json(Array.isArray(body) ? results : results[0], {
    headers: { "MCP-Protocol-Version": PROTOCOL_VERSION },
  })
}

export async function GET() {
  // No server-initiated SSE stream; per the Streamable HTTP spec, GET may return 405.
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } })
}
