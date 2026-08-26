interface CotalPresence {
  agent_id: string;
  name: string;
  description: string;
  capabilities: string[];
  mcp_endpoint: string;
  auth_method: string;
  status: "online" | "offline";
}

const PRESENCE: CotalPresence = {
  agent_id: "titlewise-gateway",
  name: "TitleWise",
  description: "Real estate document intelligence. Analyzes title commitments, verifies wire instructions, reviews closing disclosures, and audits HOA documents.",
  capabilities: [
    "analyze_commitment",
    "verify_wire",
    "analyze_closing_disclosure",
    "review_hoa",
  ],
  mcp_endpoint: "/sse",
  auth_method: "ic_token",
  status: "online",
};

export async function announceToCotal(workerUrl: string, cotalEndpoint?: string): Promise<void> {
  const endpoint = cotalEndpoint || "https://api.cotal.ai/v1/presence";

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...PRESENCE,
        mcp_endpoint: `${workerUrl}/sse`,
      }),
    });
  } catch {
    // Non-fatal — Cotal presence is best-effort
  }
}

export function getCotalManifest(workerUrl: string): object {
  return {
    ...PRESENCE,
    mcp_endpoint: `${workerUrl}/sse`,
    discovery: `${workerUrl}/llms.txt`,
    health: `${workerUrl}/health`,
  };
}
