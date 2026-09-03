import { describe, it, expect } from "vitest";
import { computeConsensus, type PanelVerdict } from "../src/pipeline";

function makeVerdict(overrides: Partial<PanelVerdict> = {}): PanelVerdict {
  return {
    agent: "Test Agent",
    role: "tester",
    overall_risk: "LOW",
    confidence: 0.8,
    key_finding: "test",
    agrees_with_primary: true,
    additional_concerns: [],
    ...overrides,
  };
}

describe("computeConsensus", () => {
  it("returns LOW when all 3 panelists vote LOW", () => {
    const verdicts = [makeVerdict(), makeVerdict(), makeVerdict()];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("LOW");
    expect(result.quorumMet).toBe(true);
    expect(result.highVotes).toBe(0);
  });

  it("returns HIGH when 2+ panelists vote HIGH", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "HIGH" }),
      makeVerdict({ overall_risk: "HIGH" }),
      makeVerdict({ overall_risk: "LOW" }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("HIGH");
    expect(result.highVotes).toBe(2);
  });

  it("returns MEDIUM when exactly 1 panelist votes HIGH", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "HIGH" }),
      makeVerdict({ overall_risk: "LOW" }),
      makeVerdict({ overall_risk: "LOW" }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("MEDIUM");
    expect(result.highVotes).toBe(1);
  });

  it("excludes ABSTAIN verdicts from vote count", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
      makeVerdict({ overall_risk: "LOW" }),
      makeVerdict({ overall_risk: "LOW" }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("LOW");
    expect(result.abstainCount).toBe(1);
    expect(result.activeCount).toBe(2);
    expect(result.quorumMet).toBe(true);
  });

  it("escalates to HIGH when quorum is lost (2+ abstain)", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
      makeVerdict({ overall_risk: "LOW" }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("HIGH");
    expect(result.quorumMet).toBe(false);
    expect(result.abstainCount).toBe(2);
  });

  it("escalates to HIGH when all 3 panelists abstain", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("HIGH");
    expect(result.quorumMet).toBe(false);
    expect(result.consensusConfidence).toBe(0);
  });

  it("averages confidence only from active (non-ABSTAIN) verdicts", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
      makeVerdict({ overall_risk: "LOW", confidence: 0.9 }),
      makeVerdict({ overall_risk: "LOW", confidence: 0.7 }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusConfidence).toBeCloseTo(0.8);
  });

  it("returns unanimous HIGH when all 3 vote HIGH", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "HIGH" }),
      makeVerdict({ overall_risk: "HIGH" }),
      makeVerdict({ overall_risk: "HIGH" }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("HIGH");
    expect(result.highVotes).toBe(3);
  });

  it("counts agrees_with_primary correctly", () => {
    const verdicts = [
      makeVerdict({ agrees_with_primary: true }),
      makeVerdict({ agrees_with_primary: false }),
      makeVerdict({ agrees_with_primary: true }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.agreeVotes).toBe(2);
  });

  it("a single HIGH with 1 abstain yields MEDIUM (quorum met with 2 active)", () => {
    const verdicts = [
      makeVerdict({ overall_risk: "HIGH" }),
      makeVerdict({ overall_risk: "LOW" }),
      makeVerdict({ overall_risk: "ABSTAIN", confidence: 0 }),
    ];
    const result = computeConsensus(verdicts);
    expect(result.consensusRisk).toBe("MEDIUM");
    expect(result.quorumMet).toBe(true);
    expect(result.highVotes).toBe(1);
  });
});
