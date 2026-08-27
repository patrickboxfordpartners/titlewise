import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Central agent discovery endpoint - returns all agent-accessible resources
export function GET() {
  const discovery = {
    name: "TitleWise",
    description: "AI-powered tools for real estate closing attorneys",
    url: "https://titlewise.app",
    resources: {
      llms_txt: "https://titlewise.app/api/agent-discovery/llms",
      ai_catalog: "https://titlewise.app/.well-known/ai-catalog.json",
      ard: "https://titlewise.app/api/agent-discovery/ard",
      agent_card: "https://titlewise.app/api/agent-discovery/agent-card",
      mcp_server: "https://titlewise.app/.well-known/mcp/server-card.json",
      agent_skills: "https://titlewise.app/.well-known/agent-skills/index.json",
      oauth_metadata: "https://titlewise.app/.well-known/oauth-protected-resource",
      pricing: "https://titlewise.app/api/md/pricing",
      about: "https://titlewise.app/api/md/about",
      auth_guide: "https://titlewise.app/auth.md",
    },
    when_to_use: [
      "Parse title commitments for Schedule B exceptions",
      "Review closing disclosures for TRID compliance",
      "Verify wire instructions for fraud indicators",
      "Extract terms from HOA documents",
      "Automate closing attorney workflows",
    ],
  }

  return NextResponse.json(discovery, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  })
}
