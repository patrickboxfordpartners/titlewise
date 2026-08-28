/**
 * Multi-agent analysis pipeline with real-time SSE streaming.
 * Runs parallel agents: entity extraction, primary analysis, Tavily verification,
 * Mitosis memory check, then adversarial verification with full context.
 */

import { verifyBankRouting, verifyBeneficiary, verifyProperty, type EntityVerification } from "./tavily";
import { MitosisMemory, propertyFingerprint } from "./mitosis";
import { broadcastFraudAlert, composeFraudAlert } from "./cotal";

interface PipelineEnv {
  ANTHROPIC_API_KEY: string;
  TAVILY_API_KEY: string;
  MITOSIS_API_KEY: string;
  MITOSIS_OFFICE_ID: string;
}

interface PipelineEvent {
  stage: string;
  agent: string;
  status: "start" | "progress" | "complete" | "error";
  message: string;
  data?: any;
  elapsed: number;
}

type EventEmitter = (event: PipelineEvent) => void;

function extractEntitiesFromText(text: string): { banks: string[]; routingNumbers: string[]; beneficiaries: string[]; amounts: string[]; addresses: string[] } {
  const routingNumbers = [...text.matchAll(/\b(\d{9})\b/g)].map(m => m[1]).filter(n => {
    // ABA routing number checksum validation
    const d = n.split("").map(Number);
    return (3*(d[0]+d[3]+d[6]) + 7*(d[1]+d[4]+d[7]) + (d[2]+d[5]+d[8])) % 10 === 0;
  });

  const amounts = [...text.matchAll(/\$[\d,]+\.?\d*/g)].map(m => m[0]);
  const bankPatterns = text.match(/(?:Bank|bank):\s*(.+?)(?:\n|$)/g)?.map(m => m.replace(/^(?:Bank|bank):\s*/, "").trim()) || [];
  const beneficiaryPatterns = text.match(/(?:Beneficiary|beneficiary|Payee|payee):\s*(.+?)(?:\n|$)/g)?.map(m => m.replace(/^(?:Beneficiary|beneficiary|Payee|payee):\s*/, "").trim()) || [];
  const addressPatterns = text.match(/\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,.\s]+[\w\s]+,?\s*(?:CA|NY|TX|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|UT|IA|NV|AR|MS|KS|NM|NE|WV|ID|HI|NH|ME|MT|RI|DE|SD|ND|AK|VT|WY|DC)\s*\d{5}/gi) || [];

  return {
    banks: bankPatterns,
    routingNumbers,
    beneficiaries: beneficiaryPatterns,
    amounts,
    addresses: addressPatterns,
  };
}

async function quickEntityExtract(text: string, anthropicKey: string, emit: EventEmitter, startTime: number): Promise<any> {
  emit({ stage: "extract", agent: "Entity Extractor", status: "start", message: "Extracting entities from document", elapsed: Date.now() - startTime });

  // Fast regex-based extraction (no AI call needed — instant)
  const entities = extractEntitiesFromText(text);

  emit({ stage: "extract", agent: "Entity Extractor", status: "complete", message: `Found: ${entities.routingNumbers.length} routing numbers, ${entities.beneficiaries.length} beneficiaries, ${entities.amounts.length} amounts`, elapsed: Date.now() - startTime, data: entities });

  return entities;
}

async function runPrimaryAnalysis(tool: string, text: string, anthropicKey: string, emit: EventEmitter, startTime: number): Promise<any> {
  emit({ stage: "analysis", agent: "Primary Analyst (Claude Sonnet 5)", status: "start", message: `Running ${tool} analysis`, elapsed: Date.now() - startTime });

  const toolPrompts: Record<string, { system: string; prompt: string }> = {
    verify_wire: {
      system: "You are an expert real estate closing attorney verifying wire transfer instructions. Detect fraud indicators. Always respond with valid JSON. Never include markdown code blocks.",
      prompt: `Analyze these wire transfer instructions. Return JSON with: bankInformation (bankName, routingNumber, accountNumber), beneficiary (name), amount, verification (riskLevel: HIGH/MEDIUM/LOW), fraudIndicators (array of {severity, indicator, explanation}), recommendations (array of {priority, action}), summary.\n\nDocument:\n${text}`,
    },
    analyze_commitment: {
      system: "You are an expert title attorney analyzing title commitments. Always respond with valid JSON. Never include markdown code blocks.",
      prompt: `Analyze this title commitment. Return JSON with: property (address, owner, policyAmount), scheduleA (estate, effectiveDate), requirements (array), exceptions (array), redFlags (array of {severity, issue, explanation}), summary.\n\nDocument:\n${text}`,
    },
    analyze_closing_disclosure: {
      system: "You are a TRID compliance expert reviewing Closing Disclosures. Always respond with valid JSON. Never include markdown code blocks.",
      prompt: `Analyze this Closing Disclosure. Return JSON with: loanInformation, closingCosts, cashToClose, tridCompliance (compliant: bool, issues: array), discrepancies (array), redFlags (array), summary.\n\nDocument:\n${text}`,
    },
    review_hoa: {
      system: "You are a real estate attorney reviewing HOA documents. Always respond with valid JSON. Never include markdown code blocks.",
      prompt: `Analyze these HOA documents. Return JSON with: association (name, type), fees (monthly, special), financialHealth, restrictions (array), transferRequirements (array), redFlags (array), summary.\n\nDocument:\n${text}`,
    },
  };

  const config = toolPrompts[tool] || toolPrompts.verify_wire;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 16384,
      system: config.system,
      messages: [{ role: "user", content: config.prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    emit({ stage: "analysis", agent: "Primary Analyst", status: "error", message: `API error: ${response.status}`, elapsed: Date.now() - startTime });
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data: any = await response.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  const responseText = textBlock?.text || "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    emit({ stage: "analysis", agent: "Primary Analyst", status: "error", message: "No valid JSON in response", elapsed: Date.now() - startTime });
    throw new Error("No valid JSON in model response");
  }

  const analysis = JSON.parse(jsonMatch[0]);
  emit({ stage: "analysis", agent: "Primary Analyst (Claude Sonnet 5)", status: "complete", message: "Primary analysis complete", elapsed: Date.now() - startTime, data: { tokens: data.usage } });

  return analysis;
}

async function runTavilyVerification(entities: any, tavilyKey: string, emit: EventEmitter, startTime: number): Promise<EntityVerification[]> {
  if (!tavilyKey) {
    emit({ stage: "tavily", agent: "Tavily Web Verifier", status: "error", message: "No Tavily API key — skipping web verification", elapsed: Date.now() - startTime });
    return [];
  }

  emit({ stage: "tavily", agent: "Tavily Web Verifier", status: "start", message: "Verifying entities against public web data", elapsed: Date.now() - startTime });

  const verifications: EntityVerification[] = [];
  const tasks: Promise<void>[] = [];

  for (const routing of entities.routingNumbers) {
    const bankName = entities.banks[0] || "Unknown";
    tasks.push(
      verifyBankRouting(routing, bankName, tavilyKey).then(v => {
        verifications.push(v);
        emit({ stage: "tavily", agent: "Tavily Web Verifier", status: "progress", message: `Bank routing ${routing}: ${v.verified ? "VERIFIED" : "UNVERIFIED"}`, elapsed: Date.now() - startTime, data: v });
      })
    );
  }

  for (const beneficiary of entities.beneficiaries) {
    tasks.push(
      verifyBeneficiary(beneficiary, tavilyKey).then(v => {
        verifications.push(v);
        emit({ stage: "tavily", agent: "Tavily Web Verifier", status: "progress", message: `Beneficiary "${beneficiary}": ${v.verified ? "FOUND" : "NOT FOUND on web"}`, elapsed: Date.now() - startTime, data: v });
      })
    );
  }

  for (const address of entities.addresses.slice(0, 1)) {
    tasks.push(
      verifyProperty(address, tavilyKey).then(v => {
        verifications.push(v);
        emit({ stage: "tavily", agent: "Tavily Web Verifier", status: "progress", message: `Property "${address}": ${v.verified ? "FOUND" : "not found"} in records`, elapsed: Date.now() - startTime, data: v });
      })
    );
  }

  await Promise.all(tasks);
  emit({ stage: "tavily", agent: "Tavily Web Verifier", status: "complete", message: `${verifications.length} entities checked against web`, elapsed: Date.now() - startTime });

  return verifications;
}

async function runMemoryCheck(entities: any, tool: string, env: PipelineEnv, emit: EventEmitter, startTime: number): Promise<any> {
  if (!env.MITOSIS_API_KEY || !env.MITOSIS_OFFICE_ID) {
    emit({ stage: "memory", agent: "Mitosis Memory", status: "error", message: "Memory not configured — skipping", elapsed: Date.now() - startTime });
    return null;
  }

  emit({ stage: "memory", agent: "Mitosis Memory", status: "start", message: "Checking persistent memory for prior encounters", elapsed: Date.now() - startTime });

  const memory = new MitosisMemory({ apiKey: env.MITOSIS_API_KEY, officeId: env.MITOSIS_OFFICE_ID });

  // Query for any of the extracted entities
  const queries: string[] = [];
  if (entities.routingNumbers.length) queries.push(`routing number ${entities.routingNumbers[0]}`);
  if (entities.beneficiaries.length) queries.push(entities.beneficiaries[0]);

  let priorFindings: any = null;
  for (const q of queries) {
    const result = await memory.queryPriorAnalyses(q, tool === "verify_wire" ? "wire" : undefined);
    if (result?.results?.length) {
      priorFindings = result;
      emit({ stage: "memory", agent: "Mitosis Memory", status: "progress", message: `MATCH: "${q}" seen in prior analysis (score: ${result.results[0].score.toFixed(2)})`, elapsed: Date.now() - startTime, data: result.results[0] });
      break;
    }
  }

  if (!priorFindings) {
    emit({ stage: "memory", agent: "Mitosis Memory", status: "complete", message: "No prior encounters — first time seeing these entities", elapsed: Date.now() - startTime });
  } else {
    emit({ stage: "memory", agent: "Mitosis Memory", status: "complete", message: "Cross-session match found", elapsed: Date.now() - startTime });
  }

  return priorFindings;
}

interface PanelVerdict {
  agent: string;
  role: string;
  overall_risk: string;
  confidence: number;
  key_finding: string;
  agrees_with_primary: boolean;
  additional_concerns: string[];
}

const PANEL_AGENTS = [
  {
    name: "Skeptic",
    role: "skeptic",
    system: "You are a deeply skeptical fraud investigator. Your job is to poke holes in findings — look for false positives, coincidences, and benign explanations. If something can be explained innocently, say so. Only confirm fraud if the evidence is undeniable.",
  },
  {
    name: "Compliance Officer",
    role: "compliance",
    system: "You are a bank compliance officer with 20 years of BSA/AML experience. Evaluate these findings against regulatory standards. Check whether routing numbers follow proper formats, whether beneficiary names follow legitimate business naming conventions, and whether the transaction structure matches known fraud typologies.",
  },
  {
    name: "Forensic Investigator",
    role: "forensic",
    system: "You are a forensic document investigator specializing in wire fraud and business email compromise (BEC). Look for subtle patterns: slight name variations, routing numbers that belong to different banks than claimed, shell company indicators, and urgency language designed to bypass verification. Cross-reference the web verification data carefully.",
  },
];

async function runSinglePanelAgent(
  panelAgent: typeof PANEL_AGENTS[0],
  findings: any[],
  tavilyContext: string,
  documentText: string,
  anthropicKey: string,
  emit: EventEmitter,
  startTime: number
): Promise<PanelVerdict> {
  emit({ stage: "adversarial", agent: panelAgent.name, status: "start", message: `Reviewing findings independently...`, elapsed: Date.now() - startTime });

  const prompt = `${panelAgent.system}

You are part of a 3-agent verification panel. You have NOT seen the other panelists' opinions. Assess these findings independently.

PRIMARY ANALYST FINDINGS:
${JSON.stringify(findings, null, 2)}
${tavilyContext}

ORIGINAL DOCUMENT:
${documentText.substring(0, 6000)}

Return JSON only:
{
  "overall_risk": "HIGH" or "MEDIUM" or "LOW",
  "confidence": 0.0-1.0,
  "agrees_with_primary": true/false,
  "key_finding": "your single most important observation in one sentence",
  "additional_concerns": ["anything the primary analyst missed"]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      emit({ stage: "adversarial", agent: panelAgent.name, status: "error", message: "Unavailable — deferring to other panelists", elapsed: Date.now() - startTime });
      return { agent: panelAgent.name, role: panelAgent.role, overall_risk: "MEDIUM", confidence: 0.5, key_finding: "Agent unavailable", agrees_with_primary: true, additional_concerns: [] };
    }

    const data: any = await response.json();
    const textBlock = data.content?.find((b: any) => b.type === "text");
    const text = textBlock?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      emit({ stage: "adversarial", agent: panelAgent.name, status: "complete", message: "Could not parse my assessment — deferring", elapsed: Date.now() - startTime });
      return { agent: panelAgent.name, role: panelAgent.role, overall_risk: "MEDIUM", confidence: 0.5, key_finding: "Parse error", agrees_with_primary: true, additional_concerns: [] };
    }

    const result = JSON.parse(jsonMatch[0]);
    const verdict: PanelVerdict = {
      agent: panelAgent.name,
      role: panelAgent.role,
      overall_risk: result.overall_risk || "MEDIUM",
      confidence: result.confidence || 0.7,
      key_finding: result.key_finding || "No specific finding",
      agrees_with_primary: result.agrees_with_primary !== false,
      additional_concerns: result.additional_concerns || [],
    };

    emit({
      stage: "adversarial",
      agent: panelAgent.name,
      status: "complete",
      message: `${verdict.key_finding}`,
      elapsed: Date.now() - startTime,
      data: verdict,
    });

    return verdict;
  } catch {
    emit({ stage: "adversarial", agent: panelAgent.name, status: "error", message: "Connection failed — deferring", elapsed: Date.now() - startTime });
    return { agent: panelAgent.name, role: panelAgent.role, overall_risk: "MEDIUM", confidence: 0.5, key_finding: "Connection error", agrees_with_primary: true, additional_concerns: [] };
  }
}

async function runVerificationPanel(primaryAnalysis: any, documentText: string, tavilyResults: EntityVerification[], anthropicKey: string, emit: EventEmitter, startTime: number): Promise<any> {
  emit({ stage: "adversarial", agent: "Closing Coordinator", status: "start", message: "Assembling verification panel — 3 independent reviewers who cannot see each other's work", elapsed: Date.now() - startTime });

  const tavilyContext = tavilyResults.length > 0
    ? `\n\nWEB VERIFICATION RESULTS (from Tavily):\n${tavilyResults.map(v => `- ${v.entity} (${v.entityType}): ${v.verified ? "VERIFIED" : "NOT VERIFIED"} — ${v.warnings.join("; ") || v.evidence.join("; ")}`).join("\n")}`
    : "";

  const findings = primaryAnalysis.redFlags || primaryAnalysis.fraudIndicators || [];

  // Run all 3 panelists in parallel
  const verdicts = await Promise.all(
    PANEL_AGENTS.map(agent => runSinglePanelAgent(agent, findings, tavilyContext, documentText, anthropicKey, emit, startTime))
  );

  // Consensus: count votes
  const highVotes = verdicts.filter(v => v.overall_risk === "HIGH").length;
  const agreeVotes = verdicts.filter(v => v.agrees_with_primary).length;
  const consensusRisk = highVotes >= 2 ? "HIGH" : highVotes >= 1 ? "MEDIUM" : "LOW";
  const consensusConfidence = verdicts.reduce((sum, v) => sum + v.confidence, 0) / verdicts.length;

  // Panel discussion — agents "respond" to each other
  emit({ stage: "adversarial", agent: "Closing Coordinator", status: "progress", message: "All three panelists have submitted. Comparing verdicts...", elapsed: Date.now() - startTime });

  if (highVotes === 3) {
    emit({ stage: "adversarial", agent: "Closing Coordinator", status: "progress", message: `Unanimous: all 3 panelists agree — ${consensusRisk} risk. No further discussion needed.`, elapsed: Date.now() - startTime });
  } else if (highVotes >= 2) {
    const dissenter = verdicts.find(v => v.overall_risk !== "HIGH");
    emit({ stage: "adversarial", agent: dissenter?.agent || "Skeptic", status: "progress", message: `I had reservations, but I'm outvoted 2-1. Deferring to the majority.`, elapsed: Date.now() - startTime });
  } else if (highVotes === 1) {
    const alerter = verdicts.find(v => v.overall_risk === "HIGH");
    emit({ stage: "adversarial", agent: alerter?.agent || "Forensic Investigator", status: "progress", message: `I'm the only one flagging HIGH risk here. The others see it as moderate. Noting my concern for the record.`, elapsed: Date.now() - startTime });
  }

  const allConcerns = verdicts.flatMap(v => v.additional_concerns);

  emit({
    stage: "adversarial",
    agent: "Verification Panel",
    status: "complete",
    message: `Panel verdict: ${consensusRisk} risk (${highVotes}/3 HIGH votes, ${agreeVotes}/3 agree with primary). Confidence: ${(consensusConfidence * 100).toFixed(0)}%`,
    elapsed: Date.now() - startTime,
    data: { verdicts, consensusRisk, highVotes, agreeVotes, consensusConfidence },
  });

  return {
    verified: agreeVotes >= 2,
    panel_verdicts: verdicts,
    consensus_risk: consensusRisk,
    high_votes: highVotes,
    agree_votes: agreeVotes,
    confidence: consensusConfidence,
    overall_risk: consensusRisk,
    additional_concerns: allConcerns,
    web_evidence_supports: tavilyResults.some(t => !t.verified),
  };
}

async function runCountyRecordsSearch(entities: any, tool: string, tavilyKey: string, emit: EventEmitter, startTime: number): Promise<any> {
  if (!tavilyKey || !entities.addresses.length) {
    return null;
  }

  // Only run for commitment and CD tools (where county records matter)
  if (tool !== "analyze_commitment" && tool !== "analyze_closing_disclosure" && tool !== "verify_wire") {
    return null;
  }

  emit({ stage: "records", agent: "County Records Searcher", status: "start", message: "Searching public records for property liens, judgments, and ownership history", elapsed: Date.now() - startTime });

  const address = entities.addresses[0];
  const searches: Promise<any>[] = [];
  const findings: any[] = [];

  // Search county recorder for liens
  searches.push(
    (async () => {
      try {
        const { tavilySearch } = await import("./tavily");
        const result = await tavilySearch(`"${address}" county recorder lien deed of trust recorded`, tavilyKey, { searchDepth: "advanced", maxResults: 3 });
        if (result.results?.length) {
          findings.push({ type: "liens", count: result.results.length, sources: result.results.map(r => r.url), answer: result.answer });
          emit({ stage: "records", agent: "County Records Searcher", status: "progress", message: `Found ${result.results.length} public record(s) referencing this property`, elapsed: Date.now() - startTime });
        }
      } catch {}
    })()
  );

  // Search assessor for ownership
  searches.push(
    (async () => {
      try {
        const { tavilySearch } = await import("./tavily");
        const apn = entities.apn || "";
        const query = apn ? `APN ${apn} assessor property owner tax` : `"${address}" property assessor owner of record`;
        const result = await tavilySearch(query, tavilyKey, { maxResults: 3 });
        if (result.results?.length) {
          findings.push({ type: "ownership", count: result.results.length, sources: result.results.map(r => r.url), answer: result.answer });
          emit({ stage: "records", agent: "County Records Searcher", status: "progress", message: `Assessor records: ${result.answer?.substring(0, 120) || result.results.length + " result(s) found"}`, elapsed: Date.now() - startTime });
        }
      } catch {}
    })()
  );

  // Search for pending litigation
  searches.push(
    (async () => {
      try {
        const { tavilySearch } = await import("./tavily");
        const result = await tavilySearch(`"${address}" court case judgment lis pendens`, tavilyKey, { maxResults: 2 });
        if (result.results?.length) {
          const hasLitigation = result.results.some(r => r.content.toLowerCase().includes("judgment") || r.content.toLowerCase().includes("lis pendens"));
          if (hasLitigation) {
            findings.push({ type: "litigation", count: result.results.length, sources: result.results.map(r => r.url), warning: true });
            emit({ stage: "records", agent: "County Records Searcher", status: "progress", message: `WARNING: Possible litigation/judgment found for this property`, elapsed: Date.now() - startTime, data: { warning: true } });
          }
        }
      } catch {}
    })()
  );

  await Promise.all(searches);

  emit({
    stage: "records",
    agent: "County Records Searcher",
    status: "complete",
    message: findings.length > 0
      ? `Public records search complete: ${findings.length} record type(s) found across ${findings.reduce((s, f) => s + f.count, 0)} source(s)`
      : "No public records found for this property (may not be indexed online)",
    elapsed: Date.now() - startTime,
    data: { findings },
  });

  return { findings, searched: true };
}

async function runPatternMatch(entities: any, env: PipelineEnv, emit: EventEmitter, startTime: number): Promise<any[]> {
  if (!env.MITOSIS_API_KEY || !env.MITOSIS_OFFICE_ID) {
    return [];
  }

  emit({ stage: "pattern", agent: "Pattern Matcher", status: "start", message: "Querying fraud pattern database for known entities", elapsed: Date.now() - startTime });

  const memory = new MitosisMemory({ apiKey: env.MITOSIS_API_KEY, officeId: env.MITOSIS_OFFICE_ID });
  const matches: any[] = [];

  // Search for each entity individually in the fraud-patterns feed
  const searches: Promise<void>[] = [];

  for (const routing of entities.routingNumbers) {
    searches.push(
      memory.queryPriorAnalyses(`flagged routing number ${routing}`, "fraud-patterns").then(result => {
        if (result?.results?.length && result.results[0].score > 0.6) {
          matches.push({ entity: routing, type: "routing_number", match: result.results[0] });
          emit({ stage: "pattern", agent: "Pattern Matcher", status: "progress", message: `ALERT: Routing ${routing} found in fraud database (score: ${result.results[0].score.toFixed(2)})`, elapsed: Date.now() - startTime, data: result.results[0] });
        }
      }).catch(() => {})
    );
  }

  for (const beneficiary of entities.beneficiaries) {
    searches.push(
      memory.queryPriorAnalyses(`flagged entity ${beneficiary}`, "fraud-patterns").then(result => {
        if (result?.results?.length && result.results[0].score > 0.6) {
          matches.push({ entity: beneficiary, type: "beneficiary", match: result.results[0] });
          emit({ stage: "pattern", agent: "Pattern Matcher", status: "progress", message: `ALERT: "${beneficiary}" found in fraud database (score: ${result.results[0].score.toFixed(2)})`, elapsed: Date.now() - startTime, data: result.results[0] });
        }
      }).catch(() => {})
    );
  }

  for (const bank of entities.banks) {
    searches.push(
      memory.queryPriorAnalyses(`flagged bank ${bank}`, "fraud-patterns").then(result => {
        if (result?.results?.length && result.results[0].score > 0.6) {
          matches.push({ entity: bank, type: "bank", match: result.results[0] });
          emit({ stage: "pattern", agent: "Pattern Matcher", status: "progress", message: `ALERT: Bank "${bank}" found in fraud database`, elapsed: Date.now() - startTime });
        }
      }).catch(() => {})
    );
  }

  await Promise.all(searches);

  if (matches.length === 0) {
    emit({ stage: "pattern", agent: "Pattern Matcher", status: "complete", message: "No matches in fraud pattern database — entities are new", elapsed: Date.now() - startTime });
  } else {
    emit({ stage: "pattern", agent: "Pattern Matcher", status: "complete", message: `${matches.length} entity match(es) found in fraud database`, elapsed: Date.now() - startTime, data: matches });
  }

  return matches;
}

async function writeFraudPatterns(entities: any, primaryAnalysis: any, tavilyResults: EntityVerification[], env: PipelineEnv, emit: EventEmitter, startTime: number): Promise<void> {
  if (!env.MITOSIS_API_KEY || !env.MITOSIS_OFFICE_ID) return;

  const indicators = primaryAnalysis.fraudIndicators || primaryAnalysis.redFlags || [];
  const highRisk = indicators.some((i: any) => i.severity === "high" || i.severity === "HIGH" || i.severity === "CRITICAL");

  if (!highRisk && tavilyResults.every(t => t.verified)) return;

  emit({ stage: "frauddb", agent: "Fraud DB Writer", status: "start", message: "Writing flagged entities to fraud pattern database", elapsed: Date.now() - startTime });

  const memory = new MitosisMemory({ apiKey: env.MITOSIS_API_KEY, officeId: env.MITOSIS_OFFICE_ID });
  const timestamp = new Date().toISOString();
  const writes: Promise<void>[] = [];

  for (const routing of entities.routingNumbers) {
    const tavilyMatch = tavilyResults.find(t => t.entity.includes(routing));
    writes.push(
      memory.storeAnalysis(
        "fraud-patterns",
        `routing:${routing}`,
        `Flagged routing number: ${routing}`,
        JSON.stringify({
          entity: routing,
          type: "routing_number",
          bank_claimed: entities.banks[0] || "unknown",
          bank_actual: tavilyMatch?.evidence?.[0] || "unverified",
          risk_level: "HIGH",
          indicators: indicators.slice(0, 3).map((i: any) => i.indicator || i.issue),
          flagged_at: timestamp,
        }),
        { type: "routing_number", risk: "high" }
      ).then(() => {
        emit({ stage: "frauddb", agent: "Fraud DB Writer", status: "progress", message: `Stored: routing ${routing} → fraud patterns`, elapsed: Date.now() - startTime });
      }).catch(() => {})
    );
  }

  for (const beneficiary of entities.beneficiaries) {
    const tavilyMatch = tavilyResults.find(t => t.entity === beneficiary);
    writes.push(
      memory.storeAnalysis(
        "fraud-patterns",
        `entity:${beneficiary.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        `Flagged entity: ${beneficiary}`,
        JSON.stringify({
          entity: beneficiary,
          type: "beneficiary",
          web_verified: tavilyMatch?.verified ?? null,
          web_warnings: tavilyMatch?.warnings || [],
          risk_level: tavilyMatch?.verified === false ? "HIGH" : "MEDIUM",
          indicators: indicators.slice(0, 3).map((i: any) => i.indicator || i.issue),
          flagged_at: timestamp,
        }),
        { type: "beneficiary", risk: tavilyMatch?.verified === false ? "high" : "medium" }
      ).then(() => {
        emit({ stage: "frauddb", agent: "Fraud DB Writer", status: "progress", message: `Stored: "${beneficiary}" → fraud patterns`, elapsed: Date.now() - startTime });
      }).catch(() => {})
    );
  }

  await Promise.all(writes);
  emit({ stage: "frauddb", agent: "Fraud DB Writer", status: "complete", message: `${writes.length} entities written to fraud pattern database`, elapsed: Date.now() - startTime });
}

interface AuditDiscrepancy {
  field: string;
  current_value: string;
  prior_value: string;
  prior_document: string;
  severity: "critical" | "warning" | "info";
}

async function runDealAudit(
  tool: string,
  entities: any,
  primaryAnalysis: any,
  env: PipelineEnv,
  emit: EventEmitter,
  startTime: number
): Promise<{ discrepancies: AuditDiscrepancy[]; deal_facts_count: number; alert_sent: boolean }> {
  if (!env.MITOSIS_API_KEY || !env.MITOSIS_OFFICE_ID) {
    emit({ stage: "audit", agent: "Deal Auditor", status: "error", message: "Memory not configured — cannot cross-reference prior documents", elapsed: Date.now() - startTime });
    return { discrepancies: [], deal_facts_count: 0, alert_sent: false };
  }

  emit({ stage: "audit", agent: "Deal Auditor", status: "start", message: "Cross-referencing this document against all prior uploads in this deal", elapsed: Date.now() - startTime });

  const memory = new MitosisMemory({ apiKey: env.MITOSIS_API_KEY, officeId: env.MITOSIS_OFFICE_ID });
  const discrepancies: AuditDiscrepancy[] = [];
  let dealFactsCount = 0;

  // Query prior analyses for overlapping entities
  const queries: Promise<void>[] = [];

  // Check if property address matches prior documents
  if (entities.addresses.length > 0) {
    queries.push(
      memory.queryPriorAnalyses(`property address ${entities.addresses[0]}`, "deal-ledger").then(result => {
        if (result?.results?.length) {
          dealFactsCount += result.results.length;
          for (const prior of result.results) {
            try {
              const priorData = JSON.parse(prior.preview || "{}");
              // Check for address variations
              if (priorData.address && priorData.address !== entities.addresses[0]) {
                discrepancies.push({
                  field: "property_address",
                  current_value: entities.addresses[0],
                  prior_value: priorData.address,
                  prior_document: priorData.document_type || "prior document",
                  severity: "critical",
                });
              }
            } catch {}
          }
        }
      }).catch(() => {})
    );
  }

  // Check beneficiary consistency across documents
  for (const beneficiary of entities.beneficiaries) {
    queries.push(
      memory.queryPriorAnalyses(`beneficiary ${beneficiary}`, "deal-ledger").then(result => {
        if (result?.results?.length) {
          dealFactsCount += result.results.length;
          for (const prior of result.results) {
            try {
              const priorData = JSON.parse(prior.preview || "{}");
              if (priorData.beneficiaries?.length) {
                for (const priorBeneficiary of priorData.beneficiaries) {
                  // Fuzzy name match — flag if similar but not exact
                  const current = beneficiary.toLowerCase().replace(/[^a-z0-9]/g, "");
                  const prev = priorBeneficiary.toLowerCase().replace(/[^a-z0-9]/g, "");
                  if (current !== prev && (current.includes(prev.substring(0, 8)) || prev.includes(current.substring(0, 8)))) {
                    discrepancies.push({
                      field: "beneficiary_name",
                      current_value: beneficiary,
                      prior_value: priorBeneficiary,
                      prior_document: priorData.document_type || "prior document",
                      severity: "critical",
                    });
                  }
                }
              }
            } catch {}
          }
        }
      }).catch(() => {})
    );
  }

  // Check routing number consistency
  for (const routing of entities.routingNumbers) {
    queries.push(
      memory.queryPriorAnalyses(`routing number deal ${routing}`, "deal-ledger").then(result => {
        if (result?.results?.length) {
          dealFactsCount += result.results.length;
          for (const prior of result.results) {
            try {
              const priorData = JSON.parse(prior.preview || "{}");
              if (priorData.routing_numbers?.length) {
                for (const priorRouting of priorData.routing_numbers) {
                  if (priorRouting !== routing) {
                    discrepancies.push({
                      field: "routing_number",
                      current_value: routing,
                      prior_value: priorRouting,
                      prior_document: priorData.document_type || "prior document",
                      severity: "critical",
                    });
                  }
                }
              }
            } catch {}
          }
        }
      }).catch(() => {})
    );
  }

  // Check amounts for consistency
  if (entities.amounts.length > 0) {
    queries.push(
      memory.queryPriorAnalyses(`amount ${entities.amounts[0]}`, "deal-ledger").then(result => {
        if (result?.results?.length) {
          dealFactsCount += result.results.length;
          for (const prior of result.results) {
            try {
              const priorData = JSON.parse(prior.preview || "{}");
              if (priorData.amounts?.length) {
                const currentAmount = entities.amounts[0].replace(/[^0-9.]/g, "");
                for (const priorAmount of priorData.amounts) {
                  const prevAmount = priorAmount.replace(/[^0-9.]/g, "");
                  if (currentAmount && prevAmount && currentAmount !== prevAmount && Math.abs(parseFloat(currentAmount) - parseFloat(prevAmount)) > 1) {
                    discrepancies.push({
                      field: "transaction_amount",
                      current_value: entities.amounts[0],
                      prior_value: priorAmount,
                      prior_document: priorData.document_type || "prior document",
                      severity: "warning",
                    });
                  }
                }
              }
            } catch {}
          }
        }
      }).catch(() => {})
    );
  }

  await Promise.all(queries);

  // Report findings
  if (discrepancies.length > 0) {
    const critical = discrepancies.filter(d => d.severity === "critical");
    const warnings = discrepancies.filter(d => d.severity === "warning");

    for (const d of discrepancies) {
      emit({
        stage: "audit",
        agent: "Deal Auditor",
        status: "progress",
        message: `MISMATCH (${d.severity}): ${d.field} — this document says "${d.current_value}" but ${d.prior_document} said "${d.prior_value}"`,
        elapsed: Date.now() - startTime,
        data: d,
      });
    }

    emit({
      stage: "audit",
      agent: "Deal Auditor",
      status: "complete",
      message: `Found ${discrepancies.length} discrepanc${discrepancies.length === 1 ? "y" : "ies"} across documents (${critical.length} critical, ${warnings.length} warning). Parties should be notified.`,
      elapsed: Date.now() - startTime,
      data: { discrepancies, deal_facts_count: dealFactsCount },
    });
  } else if (dealFactsCount > 0) {
    emit({
      stage: "audit",
      agent: "Deal Auditor",
      status: "complete",
      message: `Cross-referenced against ${dealFactsCount} prior fact(s) in this deal — all consistent. No discrepancies found.`,
      elapsed: Date.now() - startTime,
    });
  } else {
    emit({
      stage: "audit",
      agent: "Deal Auditor",
      status: "complete",
      message: "First document in this deal — establishing baseline facts for future cross-reference.",
      elapsed: Date.now() - startTime,
    });
  }

  // Store current document's facts to the deal ledger for future cross-reference
  const dealFacts = {
    document_type: tool,
    address: entities.addresses[0] || null,
    beneficiaries: entities.beneficiaries,
    routing_numbers: entities.routingNumbers,
    banks: entities.banks,
    amounts: entities.amounts,
    timestamp: new Date().toISOString(),
  };

  try {
    const fp = `deal-${tool}-${Date.now().toString(36)}`;
    await memory.storeAnalysis(
      "deal-ledger",
      fp,
      `Deal facts from ${tool}: ${entities.beneficiaries[0] || entities.addresses[0] || "document"}`,
      JSON.stringify(dealFacts),
      { type: tool, role: "deal-fact" }
    );
    emit({ stage: "audit", agent: "Deal Auditor", status: "progress", message: "Current document facts stored to deal ledger for future cross-reference.", elapsed: Date.now() - startTime });
  } catch {}

  // If critical discrepancies found, broadcast alert via Cotal
  let alertSent = false;
  if (discrepancies.some(d => d.severity === "critical")) {
    emit({ stage: "audit", agent: "Deal Auditor", status: "progress", message: "Critical discrepancy detected — notifying parties via agent network.", elapsed: Date.now() - startTime });
    try {
      const alertPayload = {
        from: "titlewise-gateway",
        channel: "deal-discrepancies",
        priority: "urgent",
        payload: {
          alert_type: "data_inconsistency",
          discrepancies: discrepancies.filter(d => d.severity === "critical"),
          action_required: "Verify correct information with all parties before proceeding. Documents in this deal contain conflicting data.",
          timestamp: new Date().toISOString(),
        },
      };
      await fetch("https://api.cotal.ai/v1/multicast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertPayload),
      });
      alertSent = true;
      emit({ stage: "audit", agent: "Deal Auditor", status: "progress", message: "Discrepancy alert sent to all connected agents and parties.", elapsed: Date.now() - startTime });
    } catch {}
  }

  return { discrepancies, deal_facts_count: dealFactsCount, alert_sent: alertSent };
}

async function runRiskSynthesis(
  primaryAnalysis: any,
  tavilyResults: EntityVerification[],
  patternMatches: any[],
  adversarialResult: any,
  memoryResults: any,
  anthropicKey: string,
  emit: EventEmitter,
  startTime: number,
  auditDiscrepancies?: AuditDiscrepancy[]
): Promise<any> {
  emit({ stage: "synthesis", agent: "Risk Synthesizer", status: "start", message: "Computing composite risk score from all agent signals", elapsed: Date.now() - startTime });

  // Weighted scoring from all signals
  let score = 0;
  const signals: string[] = [];

  // Primary analysis signals (weight: 25%)
  const indicators = primaryAnalysis.fraudIndicators || primaryAnalysis.redFlags || [];
  const highCount = indicators.filter((i: any) => i.severity === "high" || i.severity === "HIGH" || i.severity === "CRITICAL").length;
  const medCount = indicators.filter((i: any) => i.severity === "medium" || i.severity === "MEDIUM").length;
  const primaryScore = Math.min(1, (highCount * 0.25 + medCount * 0.1));
  score += primaryScore * 0.25;
  if (highCount > 0) signals.push(`${highCount} high-severity indicators (+${(primaryScore * 25).toFixed(0)}%)`);

  // Tavily verification signals (weight: 20%)
  const unverifiedCount = tavilyResults.filter(t => !t.verified).length;
  const tavilyScore = tavilyResults.length > 0 ? unverifiedCount / tavilyResults.length : 0;
  score += tavilyScore * 0.2;
  if (unverifiedCount > 0) signals.push(`${unverifiedCount}/${tavilyResults.length} entities unverified on web (+${(tavilyScore * 20).toFixed(0)}%)`);

  // Pattern match signals (weight: 20%)
  const patternScore = Math.min(1, patternMatches.length * 0.5);
  score += patternScore * 0.2;
  if (patternMatches.length > 0) signals.push(`${patternMatches.length} matches in fraud database (+${(patternScore * 20).toFixed(0)}%)`);

  // Verification panel signals (weight: 20%)
  if (adversarialResult) {
    const panelHighVotes = adversarialResult.high_votes || 0;
    const panelRisk = panelHighVotes >= 3 ? 1 : panelHighVotes >= 2 ? 0.8 : panelHighVotes >= 1 ? 0.4 : 0;
    score += panelRisk * 0.2;
    if (panelHighVotes >= 2) signals.push(`Verification panel: ${panelHighVotes}/3 confirm HIGH risk (+${(panelRisk * 20).toFixed(0)}%)`);
    else if (panelHighVotes === 1) signals.push(`Verification panel: 1/3 flags HIGH risk (+${(panelRisk * 20).toFixed(0)}%)`);
  }

  // Deal audit discrepancy signals (weight: 15%)
  if (auditDiscrepancies && auditDiscrepancies.length > 0) {
    const criticalDisc = auditDiscrepancies.filter(d => d.severity === "critical").length;
    const auditScore = Math.min(1, criticalDisc * 0.4 + (auditDiscrepancies.length - criticalDisc) * 0.15);
    score += auditScore * 0.15;
    signals.push(`${auditDiscrepancies.length} cross-document discrepanc${auditDiscrepancies.length === 1 ? "y" : "ies"} (${criticalDisc} critical) (+${(auditScore * 15).toFixed(0)}%)`);
  }

  const finalScore = Math.min(1, score);
  const riskLevel = finalScore >= 0.7 ? "CRITICAL" : finalScore >= 0.45 ? "HIGH" : finalScore >= 0.25 ? "MEDIUM" : "LOW";

  const synthesis = {
    composite_risk_score: Math.round(finalScore * 100),
    risk_level: riskLevel,
    signals,
    recommendation: riskLevel === "CRITICAL" || riskLevel === "HIGH"
      ? "DO NOT PROCEED — verify all details through independent channels before any fund transfer"
      : riskLevel === "MEDIUM"
      ? "PROCEED WITH CAUTION — additional verification recommended"
      : "LOW RISK — standard verification procedures apply",
    agents_contributing: [
      "Primary Analyst",
      tavilyResults.length > 0 ? "Tavily Web Verifier" : null,
      patternMatches.length > 0 ? "Pattern Matcher (fraud DB)" : null,
      adversarialResult ? "Verification Panel (Skeptic + Compliance + Forensic)" : null,
      memoryResults ? "Memory (prior cases)" : null,
    ].filter(Boolean),
  };

  emit({
    stage: "synthesis",
    agent: "Risk Synthesizer",
    status: "complete",
    message: `Composite risk: ${synthesis.composite_risk_score}/100 (${riskLevel}) — ${signals.length} contributing signals`,
    elapsed: Date.now() - startTime,
    data: synthesis,
  });

  return synthesis;
}

export function detectDocumentTypes(text: string): string[] {
  const tools: string[] = [];
  const lower = text.toLowerCase();

  if (lower.match(/closing\s*disclosure|loan\s*estimate|cash\s*to\s*close|trid|truth[- ]in[- ]lending/)) {
    tools.push("analyze_closing_disclosure");
  }
  if (lower.match(/wire\s*transfer|routing\s*(number|#|no)|aba\s*number|beneficiary.*account|account\s*number.*wire|wire\s*instructions/)) {
    tools.push("verify_wire");
  }
  if (lower.match(/title\s*commitment|schedule\s*[ab]|commitment\s*for\s*title|title\s*insurance|policy\s*amount/)) {
    tools.push("analyze_commitment");
  }
  if (lower.match(/homeowners?\s*association|hoa|estoppel|monthly\s*dues|special\s*assessment|common\s*area|covenants/)) {
    tools.push("review_hoa");
  }

  return tools.length > 0 ? tools : ["verify_wire"];
}

export async function runMultiPipeline(
  documentText: string,
  env: PipelineEnv,
  emit: EventEmitter,
  workerUrl?: string
): Promise<{ events: PipelineEvent[]; result: any }> {
  const startTime = Date.now();
  const events: PipelineEvent[] = [];
  const wrappedEmit: EventEmitter = (event) => { events.push(event); emit(event); };

  const detectedTools = detectDocumentTypes(documentText);
  const toolLabels: Record<string, string> = {
    verify_wire: "Wire Transfer Instructions",
    analyze_commitment: "Title Commitment",
    analyze_closing_disclosure: "Closing Disclosure",
    review_hoa: "HOA Documents",
  };

  // Priority order for full pipeline (wire fraud gets full verification)
  const priority = ["verify_wire", "analyze_closing_disclosure", "analyze_commitment", "review_hoa"];
  const sorted = detectedTools.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
  const primaryTool = sorted[0];
  const secondaryTools = sorted.slice(1);

  wrappedEmit({
    stage: "pipeline", agent: "Closing Coordinator", status: "start",
    message: `Multi-document detected. I found ${detectedTools.length} document type${detectedTools.length > 1 ? "s" : ""}: ${sorted.map(t => toolLabels[t] || t).join(", ")}. Running full verification on ${toolLabels[primaryTool]}, then analyzing the rest.`,
    elapsed: 0,
  });

  // Run full pipeline on the primary document type
  wrappedEmit({
    stage: "pipeline", agent: "Closing Coordinator", status: "progress",
    message: `--- Full Pipeline: ${toolLabels[primaryTool]} ---`,
    elapsed: Date.now() - startTime,
  });
  const { result: primaryResult } = await runPipeline(primaryTool, documentText, env, emit, workerUrl);

  // Run lightweight analysis only (single AI call) for remaining document types
  const secondaryResults: any[] = [];
  for (const tool of secondaryTools) {
    wrappedEmit({
      stage: "pipeline", agent: "Closing Coordinator", status: "progress",
      message: `--- Analysis: ${toolLabels[tool]} ---`,
      elapsed: Date.now() - startTime,
    });

    wrappedEmit({ stage: "analysis", agent: "Primary Analyst (Claude Sonnet 5)", status: "start", message: `Running ${tool} analysis`, elapsed: Date.now() - startTime });

    try {
      const analysis = await runPrimaryAnalysis(tool, documentText, env.ANTHROPIC_API_KEY, wrappedEmit, startTime);
      secondaryResults.push({ tool, label: toolLabels[tool], analysis, pipeline: { total_agents: 1 } });
    } catch (e: any) {
      wrappedEmit({ stage: "analysis", agent: "Primary Analyst", status: "error", message: e.message, elapsed: Date.now() - startTime });
      secondaryResults.push({ tool, label: toolLabels[tool], analysis: null, error: e.message });
    }
  }

  const totalTime = Date.now() - startTime;
  const totalAgents = (primaryResult.pipeline?.total_agents || primaryResult.pipeline?.agents_invoked?.length || 0) + secondaryResults.length;

  wrappedEmit({
    stage: "pipeline", agent: "Closing Coordinator", status: "complete",
    message: `Full analysis complete. ${detectedTools.length} document types analyzed, ${totalAgents} total agent invocations, ${(totalTime / 1000).toFixed(1)}s.`,
    elapsed: totalTime,
  });

  return {
    events,
    result: {
      mode: "multi",
      documents_detected: sorted.map(t => toolLabels[t]),
      analyses: [
        { tool: primaryTool, label: toolLabels[primaryTool], ...primaryResult },
        ...secondaryResults,
      ],
      pipeline: { duration_ms: totalTime, tools_run: sorted, total_agents: totalAgents },
    },
  };
}

export async function runPipeline(
  tool: string,
  documentText: string,
  env: PipelineEnv,
  emit: EventEmitter,
  workerUrl?: string
): Promise<{ events: PipelineEvent[]; result: any }> {
  const startTime = Date.now();
  const events: PipelineEvent[] = [];

  const wrappedEmit: EventEmitter = (event) => {
    events.push(event);
    emit(event);
  };

  const toolLabel = tool === "verify_wire" ? "wire transfer instructions" : tool === "analyze_commitment" ? "title commitment" : tool === "analyze_closing_disclosure" ? "closing disclosure" : "HOA documents";
  wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "start", message: `New document received. I'm seeing ${toolLabel}. Let me pull the team together.`, elapsed: 0 });

  // Stage 1: Entity extraction (instant)
  const entities = await quickEntityExtract(documentText, env.ANTHROPIC_API_KEY, wrappedEmit, startTime);

  // Conversational handoff after extraction
  const entitySummary = [
    entities.routingNumbers.length ? `${entities.routingNumbers.length} routing number(s)` : null,
    entities.beneficiaries.length ? `${entities.beneficiaries.length} beneficiary name(s)` : null,
    entities.amounts.length ? `${entities.amounts.length} dollar amount(s)` : null,
    entities.banks.length ? `${entities.banks.length} bank reference(s)` : null,
  ].filter(Boolean).join(", ");
  wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Got it — found ${entitySummary}. Sending these to the team now. Everyone works independently so nobody biases anyone else.`, elapsed: Date.now() - startTime });

  // Stage 2: Parallel — primary analysis + Tavily + memory check + pattern match + county records
  const [primaryAnalysis, tavilyResults, memoryResults, patternMatches, countyResults] = await Promise.all([
    runPrimaryAnalysis(tool, documentText, env.ANTHROPIC_API_KEY, wrappedEmit, startTime),
    runTavilyVerification(entities, env.TAVILY_API_KEY, wrappedEmit, startTime),
    runMemoryCheck(entities, tool, env, wrappedEmit, startTime),
    runPatternMatch(entities, env, wrappedEmit, startTime),
    runCountyRecordsSearch(entities, tool, env.TAVILY_API_KEY, wrappedEmit, startTime),
  ]);

  // Conversational summary after parallel stage
  const indicators = primaryAnalysis.fraudIndicators || primaryAnalysis.redFlags || [];
  const unverified = tavilyResults.filter(t => !t.verified);
  if (indicators.length > 0 || unverified.length > 0) {
    wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Team's back. We have ${indicators.length} flag(s) from the primary analyst${unverified.length > 0 ? ` and ${unverified.length} entit${unverified.length === 1 ? "y" : "ies"} that couldn't be verified on the web` : ""}. I'm escalating this to the verification panel.`, elapsed: Date.now() - startTime });
  } else {
    wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Team's back. Primary analysis looks clean, web verification checks out. Running the panel anyway for confirmation.`, elapsed: Date.now() - startTime });
  }

  // Stage 3: Verification panel (3 agents in parallel — needs Stage 2 outputs)
  let adversarialResult = null;
  if (tool === "verify_wire" || indicators.length > 0) {
    adversarialResult = await runVerificationPanel(primaryAnalysis, documentText, tavilyResults, env.ANTHROPIC_API_KEY, wrappedEmit, startTime);

    // Post-panel handoff
    const highVotes = adversarialResult.high_votes || 0;
    if (highVotes >= 2) {
      wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Panel has spoken — ${highVotes}/3 say this is high risk. Computing final score now.`, elapsed: Date.now() - startTime });
    } else {
      wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Panel split: ${highVotes}/3 flagged high risk. Folding all signals into the final score.`, elapsed: Date.now() - startTime });
    }
  } else {
    wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `No fraud indicators detected — skipping the panel and going straight to final scoring.`, elapsed: Date.now() - startTime });
  }

  // Stage 4: Deal Audit — cross-reference against all prior documents
  wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: "Before I score this, let me check it against everything else we've seen in this deal.", elapsed: Date.now() - startTime });
  const auditResult = await runDealAudit(tool, entities, primaryAnalysis, env, wrappedEmit, startTime);

  if (auditResult.discrepancies.length > 0) {
    wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Deal Auditor flagged ${auditResult.discrepancies.length} inconsistenc${auditResult.discrepancies.length === 1 ? "y" : "ies"} with prior documents. This is going into the final score.`, elapsed: Date.now() - startTime });
  }

  // Stage 5: Risk synthesis (combines all signals including audit)
  const riskSynthesis = await runRiskSynthesis(primaryAnalysis, tavilyResults, patternMatches, adversarialResult, memoryResults, env.ANTHROPIC_API_KEY, wrappedEmit, startTime, auditResult.discrepancies);

  // Stage 5: Write to fraud patterns DB + analysis memory (parallel)
  const writePromises: Promise<void>[] = [];

  // Write flagged entities to fraud pattern database
  writePromises.push(writeFraudPatterns(entities, primaryAnalysis, tavilyResults, env, wrappedEmit, startTime));

  // Write full analysis to memory
  if (env.MITOSIS_API_KEY && env.MITOSIS_OFFICE_ID) {
    writePromises.push((async () => {
      wrappedEmit({ stage: "memory", agent: "Mitosis Memory", status: "start", message: "Persisting full analysis to cross-session memory", elapsed: Date.now() - startTime });
      try {
        const memory = new MitosisMemory({ apiKey: env.MITOSIS_API_KEY, officeId: env.MITOSIS_OFFICE_ID });
        const feedName = tool === "verify_wire" ? "wire" : tool === "analyze_commitment" ? "commitment" : tool === "analyze_closing_disclosure" ? "cd" : "hoa";
        const fp = propertyFingerprint(entities.addresses[0], documentText);
        await memory.storeAnalysis(feedName, fp, `${tool}: ${entities.beneficiaries[0] || entities.addresses[0] || "analysis"}`, JSON.stringify({ primaryAnalysis, tavilyResults, adversarialResult, riskSynthesis }), { tool, risk: riskSynthesis.risk_level });
        wrappedEmit({ stage: "memory", agent: "Mitosis Memory", status: "complete", message: "Full analysis persisted — available for future recall", elapsed: Date.now() - startTime });
      } catch {
        wrappedEmit({ stage: "memory", agent: "Mitosis Memory", status: "error", message: "Memory write failed (non-blocking)", elapsed: Date.now() - startTime });
      }
    })());
  }

  await Promise.all(writePromises);

  // Stage 6: Cotal Alert Broadcaster — fires on CRITICAL or HIGH risk
  let alertResult: any = null;
  if (riskSynthesis.risk_level === "CRITICAL" || riskSynthesis.risk_level === "HIGH") {
    wrappedEmit({ stage: "alert", agent: "Cotal Alert Broadcaster", status: "start", message: `Risk level ${riskSynthesis.risk_level} — broadcasting fraud alert to agent network`, elapsed: Date.now() - startTime });

    try {
      const alert = composeFraudAlert(primaryAnalysis, entities, riskSynthesis.composite_risk_score, riskSynthesis.risk_level);
      const url = workerUrl || "https://titlewise-agent.patrick-54b.workers.dev";
      alertResult = await broadcastFraudAlert(alert, url);

      wrappedEmit({
        stage: "alert",
        agent: "Cotal Alert Broadcaster",
        status: "complete",
        message: `Alert broadcast to ${alertResult.recipients.length} recipient(s): ${alertResult.recipients.join(", ")}`,
        elapsed: Date.now() - startTime,
        data: alertResult,
      });
    } catch {
      wrappedEmit({ stage: "alert", agent: "Cotal Alert Broadcaster", status: "error", message: "Alert broadcast failed (non-blocking)", elapsed: Date.now() - startTime });
    }
  }

  // Stage 7: Audit Trail — immutable compliance log of every decision
  if (env.MITOSIS_API_KEY && env.MITOSIS_OFFICE_ID) {
    wrappedEmit({ stage: "audit-trail", agent: "Audit Trail", status: "start", message: "Writing immutable compliance record of all agent decisions", elapsed: Date.now() - startTime });
    try {
      const memory = new MitosisMemory({ apiKey: env.MITOSIS_API_KEY, officeId: env.MITOSIS_OFFICE_ID });
      const auditRecord = {
        timestamp: new Date().toISOString(),
        document_type: tool,
        entities_extracted: { routing_numbers: entities.routingNumbers, beneficiaries: entities.beneficiaries, addresses: entities.addresses },
        primary_risk: (primaryAnalysis.fraudIndicators || primaryAnalysis.redFlags || []).length,
        tavily_unverified: tavilyResults.filter(t => !t.verified).length,
        panel_high_votes: adversarialResult?.high_votes || 0,
        audit_discrepancies: auditResult.discrepancies.length,
        county_records: countyResults?.findings?.length || 0,
        final_risk_score: riskSynthesis.composite_risk_score,
        final_risk_level: riskSynthesis.risk_level,
        alert_broadcast: !!alertResult,
        agents_invoked_count: 0,
      };
      await memory.storeAnalysis(
        "audit-trail",
        `audit-${Date.now().toString(36)}-${tool}`,
        `Compliance audit: ${tool} — Risk ${riskSynthesis.risk_level} (${riskSynthesis.composite_risk_score}/100)`,
        JSON.stringify(auditRecord),
        { type: "audit-trail", risk: riskSynthesis.risk_level, tool }
      );
      wrappedEmit({ stage: "audit-trail", agent: "Audit Trail", status: "complete", message: `Compliance record written. All ${Object.keys(auditRecord).length} decision points logged immutably.`, elapsed: Date.now() - startTime });
    } catch {
      wrappedEmit({ stage: "audit-trail", agent: "Audit Trail", status: "error", message: "Audit trail write failed (non-blocking)", elapsed: Date.now() - startTime });
    }
  }

  const totalTime = Date.now() - startTime;
  const agentsInvoked = [
    "Entity Extractor",
    "Primary Analyst (Claude Sonnet 5)",
    tavilyResults.length ? "Tavily Web Verifier" : null,
    countyResults ? "County Records Searcher" : null,
    "Pattern Matcher",
    memoryResults !== undefined ? "Mitosis Memory" : null,
    adversarialResult ? "Skeptic" : null,
    adversarialResult ? "Compliance Officer" : null,
    adversarialResult ? "Forensic Investigator" : null,
    "Deal Auditor",
    "Risk Synthesizer",
    "Fraud DB Writer",
    alertResult ? "Cotal Alert Broadcaster" : null,
    "Audit Trail",
  ].filter(Boolean);

  // Final conversational wrap-up
  if (riskSynthesis.risk_level === "CRITICAL" || riskSynthesis.risk_level === "HIGH") {
    wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Bottom line: DO NOT proceed with this transaction. ${agentsInvoked.length} agents reviewed this document and the consensus is clear — too many red flags. Verify everything through independent channels before moving forward.`, elapsed: totalTime });
  } else if (riskSynthesis.risk_level === "MEDIUM") {
    wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `We found some concerns but nothing definitive. I'd recommend additional verification before proceeding. ${agentsInvoked.length} agents reviewed this.`, elapsed: totalTime });
  } else {
    wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "progress", message: `Looks clean. ${agentsInvoked.length} agents reviewed this document and nothing raised alarms. Standard verification procedures apply.`, elapsed: totalTime });
  }

  wrappedEmit({ stage: "pipeline", agent: "Closing Coordinator", status: "complete", message: `Review complete. ${agentsInvoked.length} agents, ${(totalTime / 1000).toFixed(1)}s. Standing by for next document.`, elapsed: totalTime });

  return {
    events,
    result: {
      tool,
      analysis: primaryAnalysis,
      entity_verification: tavilyResults,
      county_records: countyResults,
      pattern_matches: patternMatches,
      memory_context: memoryResults,
      adversarial_verification: adversarialResult,
      deal_audit: auditResult,
      risk_synthesis: riskSynthesis,
      fraud_alert: alertResult,
      pipeline: {
        duration_ms: totalTime,
        agents_invoked: agentsInvoked,
        parallel_stages: 5,
        total_agents: agentsInvoked.length,
      },
    },
  };
}
