"use client"

import Script from "next/script"

const WEBMCP_INIT = `
(function() {
  if (!navigator.modelContext) return;
  navigator.modelContext.provideContext({
    tools: [
      {
        name: "titlewise_analyze_cd",
        description: "Analyze a Closing Disclosure for TRID compliance and flag discrepancies in loan terms, closing costs, and cash-to-close figures. Requires Enterprise API key.",
        inputSchema: {
          type: "object",
          properties: {
            document_text: { type: "string", description: "Full text of the Closing Disclosure (min 100 chars)" },
            property_address: { type: "string", description: "Property address for context (optional)" }
          },
          required: ["document_text"]
        },
        execute: async function(params) {
          var r = await fetch("/api/v1/analyze-cd", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
          });
          return r.json();
        }
      },
      {
        name: "titlewise_analyze_commitment",
        description: "Parse a title commitment, identify Schedule B exceptions, and flag potential issues with easements, liens, and encumbrances. Requires Enterprise API key.",
        inputSchema: {
          type: "object",
          properties: {
            document_text: { type: "string", description: "Full text of the title commitment (min 100 chars)" },
            property_address: { type: "string", description: "Property address for context (optional)" }
          },
          required: ["document_text"]
        },
        execute: async function(params) {
          var r = await fetch("/api/v1/analyze-commitment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
          });
          return r.json();
        }
      },
      {
        name: "titlewise_verify_wire",
        description: "Cross-reference wire instructions against known patterns to detect anomalies and potential wire fraud. Requires Enterprise API key.",
        inputSchema: {
          type: "object",
          properties: {
            wire_instructions: { type: "string", description: "Full text of wire instructions" },
            recipient_name: { type: "string", description: "Expected recipient name (optional)" },
            expected_amount: { type: "string", description: "Expected wire amount (optional)" }
          },
          required: ["wire_instructions"]
        },
        execute: async function(params) {
          var r = await fetch("/api/v1/verify-wire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
          });
          return r.json();
        }
      },
      {
        name: "titlewise_review_hoa",
        description: "Extract key terms, fees, special assessments, and transfer restrictions from HOA or condo documents. Requires Enterprise API key.",
        inputSchema: {
          type: "object",
          properties: {
            document_text: { type: "string", description: "Full text of HOA documents (min 100 chars)" },
            property_address: { type: "string", description: "Property address for context (optional)" }
          },
          required: ["document_text"]
        },
        execute: async function(params) {
          var r = await fetch("/api/v1/review-hoa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
          });
          return r.json();
        }
      }
    ]
  });
})();
`

export function WebMCP() {
  return (
    <Script
      id="webmcp-tools"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: WEBMCP_INIT }}
    />
  )
}
