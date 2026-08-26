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
  private feeds: Map<string, string> = new Map();

  constructor(config: MitosisConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
    };
  }

  async ensureFeed(feedName: string): Promise<string> {
    if (this.feeds.has(feedName)) return this.feeds.get(feedName)!;

    const res = await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/feeds`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ name: feedName }),
    });

    if (res.ok) {
      const data: any = await res.json();
      const feedKey = data.feedKey || data.feed_key || feedName;
      this.feeds.set(feedName, feedKey);
      return feedKey;
    }

    // Feed might already exist — try to list and find it
    const listRes = await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/feeds`, {
      headers: this.headers(),
    });

    if (listRes.ok) {
      const feeds: any[] = await listRes.json();
      const existing = feeds.find((f: any) => f.name === feedName);
      if (existing) {
        this.feeds.set(feedName, existing.feedKey || existing.feed_key || feedName);
        return this.feeds.get(feedName)!;
      }
    }

    this.feeds.set(feedName, feedName);
    return feedName;
  }

  async storeAnalysis(feed: string, externalId: string, title: string, content: string, metadata?: Record<string, string>): Promise<void> {
    const feedKey = await this.ensureFeed(feed);

    await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/cortex/rows`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        feedKey,
        rows: [{
          external_id: externalId,
          title,
          content,
          metadata,
        }],
        deferEmbed: false,
      }),
    });
  }

  async queryPriorAnalyses(query: string, feed?: string): Promise<CortexAnswer | null> {
    const params: any = { query };
    if (feed) params.feed = feed;

    const res = await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/cortex/ask`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(params),
    });

    if (!res.ok) return null;
    return res.json();
  }

  async remember(text: string, metadata?: Record<string, string>): Promise<void> {
    await fetch(`${MITOSIS_ENDPOINT}/api/v1/offices/${this.config.officeId}/cortex/remember`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ text, metadata }),
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
): Promise<{ verified: boolean; disagreements: string[]; confidence: number }> {
  const findings = primaryAnalysis.redFlags || primaryAnalysis.fraudIndicators || [];
  if (findings.length === 0) {
    return { verified: true, disagreements: [], confidence: 1.0 };
  }

  const verificationPrompt = `You are an independent verification agent. A primary analyst flagged the following issues in a real estate document. Your job is to INDEPENDENTLY assess whether each finding is legitimate or a false positive.

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0,
      messages: [{ role: "user", content: verificationPrompt }],
    }),
  });

  if (!response.ok) {
    return { verified: true, disagreements: ["Verification agent unavailable"], confidence: 0.5 };
  }

  const data: any = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) return { verified: true, disagreements: [], confidence: 0.5 };

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { verified: true, disagreements: [], confidence: 0.5 };
    const result = JSON.parse(jsonMatch[0]);

    const disagreements = (result.verifications || [])
      .filter((v: any) => !v.verified)
      .map((v: any) => v.reason);

    return {
      verified: disagreements.length === 0,
      disagreements,
      confidence: result.overall_confidence ?? 0.8,
    };
  } catch {
    return { verified: true, disagreements: [], confidence: 0.5 };
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
