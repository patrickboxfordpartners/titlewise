import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { verifyICToken } from "./auth";
import { getCotalManifest } from "./cotal";
import { MitosisMemory, adversarialVerify, propertyFingerprint } from "./mitosis";
import { executeAnalyzeCommitment } from "./tools/analyze-commitment";
import { executeVerifyWire } from "./tools/verify-wire";
import { executeAnalyzeCD } from "./tools/analyze-cd";
import { executeReviewHOA } from "./tools/review-hoa";

export interface Env {
  TITLEWISE_API_URL: string;
  ANTHROPIC_API_KEY: string;
  MITOSIS_API_KEY: string;
  MITOSIS_OFFICE_ID: string;
}

const LLMS_TXT = `# TitleWise Agent Gateway
> Real estate document intelligence as agent-native tools. Analyze title commitments, verify wire instructions, review closing disclosures, and audit HOA documents — all via MCP.

## Capabilities
This service exposes four tools via the Model Context Protocol (MCP):

1. **analyze_commitment** — Parse title commitments, extract requirements/exceptions, flag red flags
2. **verify_wire** — Detect wire fraud indicators in transfer instructions
3. **analyze_closing_disclosure** — TRID compliance review of Closing Disclosures
4. **review_hoa** — Extract fees, restrictions, and transfer requirements from HOA docs

## Authentication
Authenticate with an Immersive Commons agent token:
- Scopes required: \`titlewise:analyze\` or \`hack:*\` (hackathon mode)
- Pass as: \`Authorization: Bearer <ic_token>\`

## MCP Endpoint
Connect your MCP client to: \`/sse\`

## Transaction Model
Each tool call is a complete transaction:
- Input: document text (plain text extracted from PDF)
- Output: structured JSON with findings, risk flags, and recommendations
- Stateless: no session required between calls

## About
TitleWise is a production SaaS platform serving real estate closing attorneys.
This agent gateway exposes its document intelligence to any MCP-compatible agent.
Built by Boxford Partners. https://titlewise.app
`;

const TOOL_NAMES = [
  "analyze_commitment",
  "verify_wire",
  "analyze_closing_disclosure",
  "review_hoa",
  "recall",
];

export class TitleWiseAgent extends McpAgent<Env, {}, {}> {
  server = new McpServer({
    name: "TitleWise",
    version: "1.0.0",
  });

  private getMemory(): MitosisMemory | null {
    if (!this.env.MITOSIS_API_KEY || !this.env.MITOSIS_OFFICE_ID) return null;
    return new MitosisMemory({
      apiKey: this.env.MITOSIS_API_KEY,
      officeId: this.env.MITOSIS_OFFICE_ID,
    });
  }

  async init() {
    this.server.tool(
      "analyze_commitment",
      "Analyze a title commitment document. Extracts property details, requirements, exceptions, and red flags. Results are stored in persistent memory for future reference.",
      {
        document_text: z.string().min(100).describe("Full text of the title commitment document"),
        property_address: z.string().optional().describe("Property address for cross-reference"),
      },
      async (args) => {
        const memory = this.getMemory();
        const fingerprint = propertyFingerprint(args.property_address, args.document_text);

        // Check memory for prior analysis
        if (memory) {
          const prior = await memory.queryPriorAnalyses(
            `title commitment analysis for ${args.property_address || "property"}`,
            "commitment"
          );
          if (prior?.results?.length && prior.results[0].score > 0.9) {
            return { content: [{ type: "text" as const, text: JSON.stringify({
              source: "memory",
              note: "Prior analysis found in agent memory",
              prior_analysis: prior.results[0].preview,
              id: prior.results[0].universal_id,
            }, null, 2) }] };
          }
        }

        const result = await executeAnalyzeCommitment(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);

        // Store in memory
        if (memory && (result as any).analysis) {
          await memory.storeAnalysis(
            "commitment",
            fingerprint,
            `Title Commitment: ${args.property_address || "Unknown property"}`,
            JSON.stringify((result as any).analysis),
            { type: "commitment", property: args.property_address || "" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "verify_wire",
      "Verify wire transfer instructions for fraud indicators. Uses adversarial verification — a second independent agent cross-checks all findings. Results persist in memory for cross-matter fraud detection.",
      {
        document_text: z.string().min(50).describe("Full text of wire transfer instructions"),
        expected_amount: z.number().optional().describe("Expected wire amount in dollars"),
        expected_beneficiary: z.string().optional().describe("Expected beneficiary name"),
      },
      async (args) => {
        const memory = this.getMemory();

        const result = await executeVerifyWire(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);
        const analysis = (result as any).analysis;

        // Adversarial verification for wire fraud (always — this is safety-critical)
        let verification = null;
        if (analysis && this.env.ANTHROPIC_API_KEY) {
          verification = await adversarialVerify(analysis, args.document_text, this.env.ANTHROPIC_API_KEY);
        }

        // Store in memory for cross-matter pattern detection
        if (memory && analysis) {
          const fingerprint = propertyFingerprint(undefined, args.document_text);
          await memory.storeAnalysis(
            "wire",
            fingerprint,
            `Wire Instructions: ${analysis.beneficiary?.name || "Unknown"}`,
            JSON.stringify({ analysis, verification }),
            { type: "wire", beneficiary: analysis.beneficiary?.name || "" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({
          ...result,
          adversarial_verification: verification,
        }, null, 2) }] };
      }
    );

    this.server.tool(
      "analyze_closing_disclosure",
      "Review a Closing Disclosure for TRID compliance, fee accuracy, and discrepancies. Results stored in persistent memory.",
      {
        document_text: z.string().min(100).describe("Full text of the Closing Disclosure document"),
        property_address: z.string().optional().describe("Property address for context"),
      },
      async (args) => {
        const memory = this.getMemory();

        const result = await executeAnalyzeCD(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);

        if (memory && (result as any).analysis) {
          const fingerprint = propertyFingerprint(args.property_address, args.document_text);
          await memory.storeAnalysis(
            "cd",
            fingerprint,
            `Closing Disclosure: ${args.property_address || "Unknown property"}`,
            JSON.stringify((result as any).analysis),
            { type: "cd", property: args.property_address || "" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "review_hoa",
      "Review HOA documents. Extracts fees, assessments, restrictions, and transfer requirements. Results stored in persistent memory.",
      {
        document_text: z.string().min(100).describe("Full text of HOA documents"),
      },
      async (args) => {
        const memory = this.getMemory();

        const result = await executeReviewHOA(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);

        if (memory && (result as any).analysis) {
          await memory.storeAnalysis(
            "hoa",
            `hoa:${Date.now()}`,
            `HOA Review: ${(result as any).analysis?.association?.name || "Unknown HOA"}`,
            JSON.stringify((result as any).analysis),
            { type: "hoa" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    // Meta-tool: query prior analyses across all feeds
    this.server.tool(
      "recall",
      "Search TitleWise's persistent memory for prior analyses. Use to check if a property was previously analyzed, find patterns across matters, or retrieve historical findings.",
      {
        query: z.string().describe("What to search for (e.g., property address, beneficiary name, HOA name)"),
        feed: z.string().optional().describe("Narrow to a specific feed: commitment, wire, cd, or hoa"),
      },
      async (args) => {
        const memory = this.getMemory();
        if (!memory) {
          return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Memory not configured" }) }] };
        }

        const results = await memory.queryPriorAnalyses(args.query, args.feed);
        return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Discovery endpoints — no auth required
    if (url.pathname === "/llms.txt" || url.pathname === "/.well-known/llms.txt") {
      return new Response(LLMS_TXT, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/") {
      return new Response(JSON.stringify({
        name: "TitleWise Agent Gateway",
        version: "1.0.0",
        description: "Real estate document intelligence via MCP",
        mcp_endpoint: "/sse",
        discovery: "/llms.txt",
        auth: "Bearer <ic_agent_token>",
        tools: TOOL_NAMES,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/cotal" || url.pathname === "/.well-known/agent.json") {
      const baseUrl = `${url.protocol}//${url.host}`;
      return new Response(JSON.stringify(getCotalManifest(baseUrl), null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Auth required for MCP endpoints
    if (url.pathname === "/sse" || url.pathname === "/mcp") {
      const authResult = await verifyICToken(request);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: authResult.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      return TitleWiseAgent.serveSSE("/sse").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
