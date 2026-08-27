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
    pricing: `${workerUrl}/api/pricing`,
    payment_protocol: "x402",
    payment_methods: ["stripe", "x402"],
    billing: {
      model: "per_analysis",
      currency: "USD",
      quote_endpoint: `${workerUrl}/api/quote`,
      checkout_endpoint: `${workerUrl}/api/checkout`,
      receipt_header: "X-Payment-Receipt",
      receipt_format: "stripe:<payment_intent_id>",
    },
  };
}

export interface FraudAlert {
  alert_id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  type: "wire_fraud" | "entity_fraud" | "document_fraud";
  summary: string;
  entities: Array<{ name: string; type: string; risk: string }>;
  recommended_action: string;
  source_agent: string;
  timestamp: string;
}

export async function broadcastFraudAlert(
  alert: FraudAlert,
  workerUrl: string
): Promise<{ sent: boolean; recipients: string[]; alert: FraudAlert }> {
  const recipients: string[] = [];

  // Broadcast to Cotal network — any connected agent gets the alert
  try {
    const multicastRes = await fetch("https://api.cotal.ai/v1/multicast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "titlewise-gateway",
        channel: "fraud-alerts",
        priority: alert.severity === "CRITICAL" ? "urgent" : "normal",
        payload: alert,
        metadata: {
          source_url: workerUrl,
          requires_ack: true,
        },
      }),
    });

    if (multicastRes.ok) {
      const data: any = await multicastRes.json();
      recipients.push(...(data.recipients || ["cotal-network"]));
    }
  } catch {
    // Cotal multicast is best-effort
  }

  // Also announce to the discovery endpoint so agents polling can pick it up
  try {
    await fetch("https://api.cotal.ai/v1/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: "titlewise-gateway",
        alert,
      }),
    });
    recipients.push("cotal-alert-subscribers");
  } catch {
    // Best-effort
  }

  return {
    sent: true,
    recipients: recipients.length > 0 ? recipients : ["broadcast-attempted"],
    alert,
  };
}

export function composeFraudAlert(
  analysis: any,
  entities: any,
  riskScore: number,
  riskLevel: string
): FraudAlert {
  const indicators = analysis.fraudIndicators || analysis.redFlags || [];
  const criticalIndicators = indicators
    .filter((i: any) => i.severity === "CRITICAL" || i.severity === "HIGH" || i.severity === "high")
    .slice(0, 3);

  const alertEntities = [
    ...entities.routingNumbers.map((r: string) => ({ name: r, type: "routing_number", risk: "high" })),
    ...entities.beneficiaries.map((b: string) => ({ name: b, type: "beneficiary", risk: "high" })),
    ...entities.banks.map((b: string) => ({ name: b, type: "bank", risk: "medium" })),
  ];

  return {
    alert_id: `tw-alert-${Date.now().toString(36)}`,
    severity: riskLevel === "CRITICAL" ? "CRITICAL" : riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
    type: "wire_fraud",
    summary: `Wire fraud indicators detected. Risk score: ${riskScore}/100. ${criticalIndicators.length} critical/high indicators found. Entities involved: ${alertEntities.map(e => e.name).join(", ")}. DO NOT transfer funds until independently verified.`,
    entities: alertEntities,
    recommended_action: analysis.recommendations?.[0]?.action || "Do not proceed with wire transfer until verified through independent channels",
    source_agent: "titlewise-gateway",
    timestamp: new Date().toISOString(),
  };
}
