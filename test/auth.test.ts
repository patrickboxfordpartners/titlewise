import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyICToken, requireScope } from "../src/auth";

function makeRequest(token?: string): Request {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return new Request("https://example.com/api/test", { headers });
}

describe("verifyICToken", () => {
  it("rejects missing Authorization header", async () => {
    const result = await verifyICToken(new Request("https://example.com"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(401);
    }
  });

  it("rejects non-Bearer format", async () => {
    const req = new Request("https://example.com", {
      headers: { Authorization: "Basic abc123" },
    });
    const result = await verifyICToken(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(401);
    }
  });

  it("rejects empty token", async () => {
    const result = await verifyICToken(makeRequest(""));
    expect(result.success).toBe(false);
  });

  it("rejects invalid token format (not agt_ or ic_)", async () => {
    const result = await verifyICToken(makeRequest("random_token_abc"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(401);
    }
  });

  describe("hackathon mode", () => {
    it("accepts matching hack secret", async () => {
      const result = await verifyICToken(makeRequest("my-secret"), true, "my-secret");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agentId).toBe("demo:hack");
        expect(result.scopes).toContain("hack:*");
      }
    });

    it("rejects non-matching token even in hackathon mode", async () => {
      const result = await verifyICToken(makeRequest("wrong-secret"), true, "my-secret");
      expect(result.success).toBe(false);
    });

    it("falls through to IC validation when no hack secret configured", async () => {
      const result = await verifyICToken(makeRequest("random_nonempty"), true);
      expect(result.success).toBe(false);
    });

    it("does not accept arbitrary nonempty strings as valid", async () => {
      const result = await verifyICToken(makeRequest("anything-goes"), true, "real-secret");
      expect(result.success).toBe(false);
    });
  });
});

describe("requireScope", () => {
  it("returns true for exact scope match", () => {
    expect(requireScope(["titlewise:analyze"], "titlewise:analyze")).toBe(true);
  });

  it("returns true for wildcard scope", () => {
    expect(requireScope(["titlewise:*"], "titlewise:analyze")).toBe(true);
  });

  it("returns true for hack scopes", () => {
    expect(requireScope(["hack:*"], "titlewise:analyze")).toBe(true);
  });

  it("returns false for insufficient scopes", () => {
    expect(requireScope(["other:read"], "titlewise:analyze")).toBe(false);
  });

  it("returns false for empty scopes", () => {
    expect(requireScope([], "titlewise:analyze")).toBe(false);
  });
});
