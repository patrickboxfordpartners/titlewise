import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  const agentCard = {
    version: "1.0",
    agent: {
      name: "TITLEwise",
      displayName: "TITLEwise Real Estate Closing Assistant",
      description: "AI-powered tools for real estate closing attorneys: title analysis, closing disclosure review, wire fraud detection, and HOA document extraction",
      type: "service",
      url: "https://titlewise.app",
      homepage: "https://titlewise.app",
    },
    capabilities: {
      skills: [
        {
          name: "analyze-title-commitment",
          description: "Parse title commitments, identify Schedule B exceptions, flag liens and encumbrances",
          inputFormat: "PDF or text",
          outputFormat: "Structured JSON with flagged issues",
        },
        {
          name: "review-closing-disclosure",
          description: "Analyze closing disclosures for TRID compliance and tolerance violations",
          inputFormat: "PDF or structured data",
          outputFormat: "Compliance report with flagged discrepancies",
        },
        {
          name: "verify-wire-instructions",
          description: "Cross-reference wire instructions against known patterns to detect fraud",
          inputFormat: "Wire instruction document or structured data",
          outputFormat: "Risk assessment with fraud indicators",
        },
        {
          name: "extract-hoa-terms",
          description: "Extract fees, special assessments, and transfer restrictions from HOA documents",
          inputFormat: "PDF or text",
          outputFormat: "Structured extraction of key terms and fees",
        },
      ],
      protocols: ["mcp", "rest-api", "agent-skills"],
      authentication: ["bearer-token", "oauth2"],
    },
    contact: {
      email: "hello@titlewise.app",
      support: "support@titlewise.app",
      website: "https://titlewise.app/contact",
    },
    endpoints: {
      mcp: "https://titlewise.app/api/mcp",
      api: "https://titlewise.app/api/v1",
      auth: "https://titlewise.app/auth.md",
      docs: "https://titlewise.app/api-docs",
    },
    documentation: {
      quickstart: "https://titlewise.app/api-docs#quickstart",
      authentication: "https://titlewise.app/auth.md",
      apiReference: "https://titlewise.app/api-docs",
      llmsTxt: "https://titlewise.app/api/agent-discovery/llms",
      agentSkills: "https://titlewise.app/.well-known/agent-skills/",
    },
    pricing: {
      model: "subscription",
      url: "https://titlewise.app/pricing",
      plans: [
        { name: "Solo", price: 149, currency: "USD", interval: "month" },
        { name: "Small Firm", price: 349, currency: "USD", interval: "month" },
        { name: "Pro", price: 599, currency: "USD", interval: "month" },
        { name: "Enterprise", price: 999, currency: "USD", interval: "month" },
      ],
    },
    metadata: {
      industry: "real-estate",
      vertical: "legal-tech",
      geography: "united-states",
      compliance: ["TRID", "SOC2-Type2", "attorney-client-privilege"],
    },
  }

  return NextResponse.json(agentCard, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  })
}
