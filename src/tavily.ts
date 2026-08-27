/**
 * Tavily integration — real-time web verification of entities found in documents.
 * Verifies banks, routing numbers, beneficiaries, companies against public web data.
 */

export interface TavilyResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
  answer?: string;
}

export interface EntityVerification {
  entity: string;
  entityType: "bank" | "routing_number" | "beneficiary" | "company" | "property";
  verified: boolean;
  confidence: number;
  evidence: string[];
  sources: string[];
  warnings: string[];
}

export async function tavilySearch(query: string, apiKey: string, options?: { searchDepth?: string; maxResults?: number }): Promise<TavilyResult> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: options?.searchDepth || "basic",
      max_results: options?.maxResults || 5,
      include_answer: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily API error: ${res.status}`);
  }

  return res.json();
}

export async function verifyBankRouting(routingNumber: string, bankName: string, apiKey: string): Promise<EntityVerification> {
  const query = `ABA routing number ${routingNumber} ${bankName} verification`;
  try {
    const result = await tavilySearch(query, apiKey, { searchDepth: "advanced", maxResults: 3 });
    const evidence: string[] = [];
    const sources: string[] = [];
    const warnings: string[] = [];
    let verified = false;

    for (const r of result.results) {
      sources.push(r.url);
      if (r.content.toLowerCase().includes(routingNumber)) {
        evidence.push(`Routing number ${routingNumber} found on ${new URL(r.url).hostname}`);
        if (r.content.toLowerCase().includes(bankName.toLowerCase())) {
          verified = true;
          evidence.push(`Bank name "${bankName}" matches routing number on ${new URL(r.url).hostname}`);
        }
      }
    }

    if (!verified && result.answer) {
      if (result.answer.toLowerCase().includes("not found") || result.answer.toLowerCase().includes("no results")) {
        warnings.push("Routing number could not be verified against public databases");
      }
    }

    return {
      entity: `${bankName} (${routingNumber})`,
      entityType: "routing_number",
      verified,
      confidence: verified ? 0.85 : 0.3,
      evidence,
      sources,
      warnings: warnings.length ? warnings : verified ? [] : ["Could not confirm routing number belongs to stated bank"],
    };
  } catch (e: any) {
    return {
      entity: `${bankName} (${routingNumber})`,
      entityType: "routing_number",
      verified: false,
      confidence: 0,
      evidence: [],
      sources: [],
      warnings: [`Verification failed: ${e.message}`],
    };
  }
}

export async function verifyBeneficiary(beneficiaryName: string, apiKey: string): Promise<EntityVerification> {
  const query = `"${beneficiaryName}" title company escrow real estate`;
  try {
    const result = await tavilySearch(query, apiKey, { maxResults: 5 });
    const evidence: string[] = [];
    const sources: string[] = [];
    const warnings: string[] = [];
    let verified = false;

    for (const r of result.results) {
      sources.push(r.url);
      const content = r.content.toLowerCase();
      const name = beneficiaryName.toLowerCase();
      if (content.includes(name) || r.title.toLowerCase().includes(name)) {
        verified = true;
        evidence.push(`"${beneficiaryName}" found on ${new URL(r.url).hostname}: ${r.title}`);
      }
    }

    if (!verified) {
      warnings.push(`No web presence found for "${beneficiaryName}" as a title/escrow company`);
      warnings.push("This may indicate a fraudulent or shell entity");
    }

    if (result.answer && result.answer.toLowerCase().includes("not")) {
      warnings.push("Web search could not confirm this is a legitimate title/escrow company");
    }

    return {
      entity: beneficiaryName,
      entityType: "beneficiary",
      verified,
      confidence: verified ? 0.8 : 0.2,
      evidence,
      sources,
      warnings,
    };
  } catch (e: any) {
    return {
      entity: beneficiaryName,
      entityType: "beneficiary",
      verified: false,
      confidence: 0,
      evidence: [],
      sources: [],
      warnings: [`Verification failed: ${e.message}`],
    };
  }
}

export async function verifyProperty(address: string, apiKey: string): Promise<EntityVerification> {
  const query = `property records "${address}" county assessor`;
  try {
    const result = await tavilySearch(query, apiKey, { maxResults: 3 });
    const evidence: string[] = [];
    const sources: string[] = [];

    for (const r of result.results) {
      sources.push(r.url);
      if (r.content.toLowerCase().includes(address.toLowerCase().split(",")[0].toLowerCase())) {
        evidence.push(`Property reference found: ${r.title}`);
      }
    }

    return {
      entity: address,
      entityType: "property",
      verified: evidence.length > 0,
      confidence: evidence.length > 0 ? 0.7 : 0.3,
      evidence,
      sources,
      warnings: evidence.length === 0 ? ["Could not confirm property in public records"] : [],
    };
  } catch (e: any) {
    return {
      entity: address,
      entityType: "property",
      verified: false,
      confidence: 0,
      evidence: [],
      sources: [],
      warnings: [`Verification failed: ${e.message}`],
    };
  }
}
