import { z } from "zod";

export const analyzeCommitmentSchema = {
  name: "analyze_commitment",
  description: "Analyze a title commitment document. Extracts property details, requirements, exceptions, and red flags. Returns structured risk assessment suitable for automated decision-making.",
  inputSchema: {
    type: "object" as const,
    properties: {
      document_text: {
        type: "string",
        description: "Full text of the title commitment document (min 100 chars, max 500KB)",
      },
      property_address: {
        type: "string",
        description: "Optional property address for cross-reference validation",
      },
    },
    required: ["document_text"],
  },
};

export async function executeAnalyzeCommitment(
  args: { document_text: string; property_address?: string },
  apiUrl: string,
  serviceKey: string
): Promise<object> {
  if (args.document_text.length < 100) {
    return { error: "document_text must be at least 100 characters" };
  }

  const response = await fetch(`${apiUrl}/api/v1/analyze-commitment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      document_text: args.document_text,
      property_address: args.property_address,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    return { error: `Analysis failed (${response.status})`, details: error };
  }

  return response.json();
}
