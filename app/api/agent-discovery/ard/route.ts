import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  const ard = {
    "specVersion": "0.91",
    "host": {
      "name": "TitleWise",
      "displayName": "TitleWise",
      "url": "https://titlewise.app",
      "description": "AI-powered tools for real estate closing attorneys"
    },
    "entries": [
      {
        "identifier": "urn:air:titlewise.app:api:analyze-cd",
        "displayName": "Closing Disclosure Analyzer",
        "mediaType": "application/openapi+json",
        "url": "https://titlewise.app/api/v1/analyze-cd",
        "description": "Analyze Closing Disclosures for TRID compliance, flag discrepancies in loan terms and closing costs",
        "representativeQueries": [
          "Review this closing disclosure for errors",
          "Check if this CD is TRID compliant",
          "Flag any tolerance violations in this closing disclosure",
          "What are the closing costs on this CD?"
        ]
      },
      {
        "identifier": "urn:air:titlewise.app:api:analyze-commitment",
        "displayName": "Title Commitment Analyzer",
        "mediaType": "application/openapi+json",
        "url": "https://titlewise.app/api/v1/analyze-commitment",
        "description": "Parse title commitments, identify Schedule B exceptions, flag easements, liens, and encumbrances",
        "representativeQueries": [
          "Analyze this title commitment for issues",
          "What exceptions are in Schedule B?",
          "Are there any liens on this property?",
          "Review this title commitment for closing"
        ]
      },
      {
        "identifier": "urn:air:titlewise.app:api:verify-wire",
        "displayName": "Wire Instruction Verifier",
        "mediaType": "application/openapi+json",
        "url": "https://titlewise.app/api/v1/verify-wire",
        "description": "Cross-reference wire instructions against known patterns to detect anomalies and potential wire fraud",
        "representativeQueries": [
          "Verify these wire instructions",
          "Do these wire instructions look legitimate?",
          "Check for wire fraud indicators",
          "Compare these wire instructions to previous transactions"
        ]
      },
      {
        "identifier": "urn:air:titlewise.app:api:review-hoa",
        "displayName": "HOA Document Reviewer",
        "mediaType": "application/openapi+json",
        "url": "https://titlewise.app/api/v1/review-hoa",
        "description": "Extract key terms, fees, special assessments, and transfer restrictions from HOA documents",
        "representativeQueries": [
          "What are the HOA fees for this property?",
          "Are there any special assessments?",
          "Review these HOA documents for the closing",
          "What rental restrictions does this HOA have?"
        ]
      },
      {
        "identifier": "urn:air:titlewise.app:mcp:server",
        "displayName": "TitleWise MCP Server",
        "mediaType": "application/mcp+json",
        "url": "https://titlewise.app/.well-known/mcp/server-card.json",
        "description": "Model Context Protocol server for AI agent integration with all TitleWise tools",
        "representativeQueries": [
          "Connect to TitleWise as an MCP server",
          "Use TitleWise tools via MCP",
          "Integrate TitleWise into my agent workflow"
        ]
      }
    ]
  }

  return NextResponse.json(ard, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  })
}
