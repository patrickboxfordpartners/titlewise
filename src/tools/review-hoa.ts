export const reviewHOASchema = {
  name: "review_hoa",
  description: "Review HOA (Homeowners Association) documents. Extracts fees, assessments, restrictions, transfer requirements, and flags issues that could delay closing or affect the buyer.",
  inputSchema: {
    type: "object" as const,
    properties: {
      document_text: {
        type: "string",
        description: "Full text of HOA documents (estoppel letter, CC&Rs, bylaws, etc.)",
      },
    },
    required: ["document_text"],
  },
};

export async function executeReviewHOA(
  args: { document_text: string },
  apiUrl: string,
  serviceKey: string
): Promise<object> {
  if (args.document_text.length < 100) {
    return { error: "document_text must be at least 100 characters" };
  }

  const response = await fetch(`${apiUrl}/api/v1/review-hoa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      document_text: args.document_text,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    return { error: `HOA review failed (${response.status})`, details: error };
  }

  return response.json();
}
