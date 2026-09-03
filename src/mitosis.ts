/**
 * Mitosis Labs integration — persistent agent memory and replication.
 * Uses REST API directly (Workers-compatible, no Node.js SDK deps).
 *
 * Architecture:
 * - One "office" per TitleWise deployment (the parent agent)
 * - One "feed" per capability (commitment, wire, cd, hoa)
 * - Each analysis is stored as a row in the appropriate feed
 * - Queries check for prior analyses before running new ones
 * - Adversarial verification: second agent independently assesses high-risk findings
 */

const MITOSIS_ENDPOINT = "https://m.mitosislabs.ai";

interface MitosisConfig {
  apiKey: string;
  officeId: string;
}

interface CortexRow {
  external_id: string;
  title: string;
  content: string;
  metadata?: Record<string, string>;
}

interface CortexAnswer {
  results: Array<{
    preview: string;
    universal_id: string;
    score: number;
    metadata?: Record<string, string>;
  }>;
}

export class MitosisMemory {
  private config: MitosisConfig;
  private tenantId: string | null = null;
  private feeds: Map<string, string> = new Map();

  constructor(config: MitosisConfig) {
    this.config = config;
  }

  setTenant(agentId: string): void {
    this.tenantId = agentId;
    this.feeds.clear();
  }

  private scopedFeedName(feed: string): string {
    if (!this.tenantId) return feed;
    const safe = this.tenantId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${safe}:${feed}`;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
    };
  }

  async ensureFeed(feedName: string): Promise<string> {
    const scoped = this.scopedFeedName(feedName);
    if (this.feeds.has(scoped)) return this.feeds.get(scoped)!;

    const res = await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/feeds`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ name: scoped }),
    });

    if (res.ok) {
      const data: any = await res.json();
      const feedKey = data.feedKey || data.feed_key || scoped;
      this.feeds.set(scoped, feedKey);
      return feedKey;
    }

    const listRes = await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/feeds`, {
      headers: this.headers(),
    });

    if (listRes.ok) {
      const feeds: any[] = await listRes.json();
      const existing = feeds.find((f: any) => f.name === scoped);
      if (existing) {
        this.feeds.set(scoped, existing.feedKey || existing.feed_key || scoped);
        return this.feeds.get(scoped)!;
      }
    }

    this.feeds.set(scoped, scoped);
    return scoped;
  }

  async storeAnalysis(feed: string, externalId: string, title: string, content: string, metadata?: Record<string, string>): Promise<void> {
    const feedKey = await this.ensureFeed(feed);
    const enriched = { ...metadata, tenant: this.tenantId || "unknown" };

    await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/cortex/rows`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        feedKey,
        rows: [{
          external_id: externalId,
          title,
          content,
          metadata: enriched,
        }],
        deferEmbed: false,
      }),
    });
  }

  async queryPriorAnalyses(query: string, feed?: string): Promise<CortexAnswer | null> {
    const params: any = { query };
    if (feed) params.feed = this.scopedFeedName(feed);

    const res = await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/cortex/ask`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(params),
    });

    if (!res.ok) return null;
    return res.json();
  }

  async remember(text: string, metadata?: Record<string, string>): Promise<void> {
    const enriched = { ...metadata, tenant: this.tenantId || "unknown" };
    await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/cortex/remember`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ text, metadata: enriched }),
    });
  }
}

/**
 * Adversarial verification — spawns a second analysis pass that independently
 * assesses high-risk findings from the primary analysis.
 */
export async function adversarialVerify(
  primaryAnalysis: any,
  documentText: string,
  anthropicKey: string
): Promise<{ verified: boolean; disagreements: string[]; confidence: number; additional_concerns?: string[] }> {
  const findings = primaryAnalysis.redFlags || primaryAnalysis.fraudIndicators || [];

  // Even when primary found nothing, independently scan the document for missed threats
  const verificationPrompt = findings.length === 0
    ? `You are an independent verification agent reviewing a real estate document. The primary analyst found NO fraud indicators or red flags. Your job is to INDEPENDENTLY review the document and determine if the primary analyst missed anything.

ORIGINAL DOCUMENT:
${documentText.substring(0, 10000)}

Assess independently. Return JSON:
{
  "verifications": [],
  "missed_findings": [
    {
      "finding": "description of missed issue",
      "severity": "HIGH" or "MEDIUM" or "LOW",
      "reason": "why this matters"
    }
  ],
  "overall_confidence": 0.0 to 1.0,
  "additional_concerns": ["anything the primary analyst missed"]
}`
    : `You are an independent verification agent. A primary analyst flagged the following issues in a real estate document. Your job is to INDEPENDENTLY assess whether each finding is legitimate or a false positive.

PRIMARY FINDINGS:
${JSON.stringify(findings, null, 2)}

ORIGINAL DOCUMENT:
${documentText.substring(0, 10000)}

For each finding, assess independently. Return JSON:
{
  "verifications": [
    {
      "finding": "the original finding description",
      "verified": true or false,
      "reason": "why you agree or disagree"
    }
  ],
  "overall_confidence": 0.0 to 1.0,
  "additional_concerns": ["anything the primary analyst missed"]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: verificationPrompt }],
    }),
  });

  if (!response.ok) {
    // Verification unavailable — do NOT default to safe
    return { verified: false, disagreements: ["Verification agent unavailable — cannot confirm safety"], confidence: 0 };
  }

  const data: any = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) return { verified: false, disagreements: ["Empty response from verification agent"], confidence: 0 };

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { verified: false, disagreements: ["Could not parse verification response"], confidence: 0 };
    const result = JSON.parse(jsonMatch[0]);

    const disagreements = (result.verifications || [])
      .filter((v: any) => !v.verified)
      .map((v: any) => v.reason);

    // Check for missed findings the adversarial agent caught independently
    const missedFindings = (result.missed_findings || [])
      .filter((f: any) => f.severity === "HIGH" || f.severity === "MEDIUM");
    const additionalConcerns = result.additional_concerns || [];

    const allIssues = [...disagreements, ...missedFindings.map((f: any) => f.finding)];

    return {
      verified: allIssues.length === 0 && additionalConcerns.length === 0,
      disagreements: allIssues,
      confidence: result.overall_confidence ?? 0.8,
      additional_concerns: additionalConcerns,
    };
  } catch {
    return { verified: false, disagreements: ["Verification parse error — cannot confirm safety"], confidence: 0 };
  }
}

/**
 * Create a property fingerprint for deduplication and memory lookup.
 */
export function propertyFingerprint(address?: string, documentPrefix?: string): string {
  if (address) return `prop:${address.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  if (documentPrefix) return `doc:${documentPrefix.substring(0, 100).replace(/\s+/g, "-")}`;
  return `doc:${Date.now()}`;
}
