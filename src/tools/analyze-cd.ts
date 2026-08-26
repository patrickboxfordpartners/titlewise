export const analyzeCDSchema = {
  name: "analyze_closing_disclosure",
  description: "Review a Closing Disclosure (CD) for TRID compliance, fee accuracy, and discrepancies. Compares loan terms, closing costs, and cash-to-close figures. Flags tolerance violations and unusual charges.",
  inputSchema: {
    type: "object" as const,
    properties: {
      document_text: {
        type: "string",
        description: "Full text of the Closing Disclosure document (min 100 chars)",
      },
      property_address: {
        type: "string",
        description: "Optional property address for context",
      },
    },
    required: ["document_text"],
  },
};

export async function executeAnalyzeCD(
  args: { document_text: string; property_address?: string },
  apiUrl: string,
  serviceKey: string
): Promise<object> {
  if (args.document_text.length < 100) {
    return { error: "document_text must be at least 100 characters" };
  }

  const response = await fetch(`${apiUrl}/api/v1/analyze-cd`, {
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
    return { error: `CD analysis failed (${response.status})`, details: error };
  }

  return response.json();
}
