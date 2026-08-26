export const verifyWireSchema = {
  name: "verify_wire",
  description: "Verify wire transfer instructions for fraud indicators. Checks routing number format, beneficiary details, and flags common wire fraud patterns. Critical safety tool for real estate closings.",
  inputSchema: {
    type: "object" as const,
    properties: {
      document_text: {
        type: "string",
        description: "Full text of wire transfer instructions (min 50 chars)",
      },
      expected_amount: {
        type: "number",
        description: "Expected wire amount in dollars. Flags discrepancies if provided.",
      },
      expected_beneficiary: {
        type: "string",
        description: "Expected beneficiary name (title company, escrow agent). Flags mismatches.",
      },
    },
    required: ["document_text"],
  },
};

export async function executeVerifyWire(
  args: { document_text: string; expected_amount?: number; expected_beneficiary?: string },
  apiUrl: string,
  serviceKey: string
): Promise<object> {
  if (args.document_text.length < 50) {
    return { error: "document_text must be at least 50 characters" };
  }

  const response = await fetch(`${apiUrl}/api/v1/verify-wire`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      document_text: args.document_text,
      expected_amount: args.expected_amount,
      expected_beneficiary: args.expected_beneficiary,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    return { error: `Verification failed (${response.status})`, details: error };
  }

  return response.json();
}
