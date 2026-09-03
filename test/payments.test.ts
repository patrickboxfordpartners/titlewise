import { describe, it, expect } from "vitest";
import { validateReceipt, getPricing, getQuote } from "../src/payments";

describe("validateReceipt", () => {
  it("rejects null receipt header", async () => {
    const result = await validateReceipt(null);
    expect(result.valid).toBe(false);
    expect(result.method).toBe("none");
  });

  it("rejects receipt without method separator", async () => {
    const result = await validateReceipt("invalidformat");
    expect(result.valid).toBe(false);
    expect(result.method).toBe("unknown");
  });

  it("rejects x402 receipts (on-chain verification not implemented)", async () => {
    const result = await validateReceipt("x402:some-long-receipt-id-here");
    expect(result.valid).toBe(false);
    expect(result.method).toBe("x402");
    expect(result.error).toContain("not yet implemented");
  });

  it("rejects stripe receipt without stripe key", async () => {
    const result = await validateReceipt("stripe:pi_test123");
    expect(result.valid).toBe(false);
  });

  it("rejects unknown payment method", async () => {
    const result = await validateReceipt("bitcoin:abc123");
    expect(result.valid).toBe(false);
    expect(result.method).toBe("bitcoin");
  });
});

describe("getPricing", () => {
  it("returns all tools with pricing", () => {
    const pricing = getPricing();
    expect(pricing.tools.length).toBeGreaterThan(0);
    expect(pricing.protocol).toBe("x402");
    expect(pricing.payment_methods).toContain("stripe");
  });

  it("includes verify_wire tool", () => {
    const pricing = getPricing();
    const wire = pricing.tools.find(t => t.tool === "verify_wire");
    expect(wire).toBeDefined();
    expect(wire!.price_cents).toBeGreaterThan(0);
  });
});

describe("getQuote", () => {
  it("returns quote for valid tool", () => {
    const quote = getQuote("verify_wire", "https://titlewise.app");
    expect(quote).not.toBeNull();
    expect(quote!.price_cents).toBeGreaterThan(0);
    expect(quote!.checkout_url).toContain("verify_wire");
  });

  it("returns null for unknown tool", () => {
    const quote = getQuote("nonexistent_tool", "https://titlewise.app");
    expect(quote).toBeNull();
  });
});
