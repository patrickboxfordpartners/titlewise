/**
 * x402 payment gate with real Stripe integration.
 * Agents discover pricing via /api/pricing, create a Checkout session via /api/checkout,
 * and pass the resulting payment intent ID as X-Payment-Receipt: stripe:pi_xxxxx.
 * The receipt is validated against the Stripe API in real-time.
 */

export interface ToolPricing {
  tool: string;
  description: string;
  price_cents: number;
  currency: string;
  per: string;
}

export const PRICING: ToolPricing[] = [
  { tool: "verify_wire", description: "Wire fraud detection with 3-agent verification panel", price_cents: 250, currency: "USD", per: "analysis" },
  { tool: "analyze_commitment", description: "Title commitment analysis with county records search", price_cents: 200, currency: "USD", per: "analysis" },
  { tool: "analyze_closing_disclosure", description: "TRID compliance review of Closing Disclosure", price_cents: 200, currency: "USD", per: "analysis" },
  { tool: "review_hoa", description: "HOA document review and risk assessment", price_cents: 150, currency: "USD", per: "analysis" },
  { tool: "recall", description: "Cross-session memory query", price_cents: 25, currency: "USD", per: "query" },
];

export interface PaymentReceipt {
  valid: boolean;
  method: string;
  receipt_id?: string;
  amount_cents?: number;
  error?: string;
}

export function getPricing(): { tools: ToolPricing[]; payment_methods: string[]; protocol: string } {
  return {
    tools: PRICING,
    payment_methods: ["stripe", "x402"],
    protocol: "x402",
  };
}

export function getQuote(tool: string, baseUrl: string): { tool: string; price_cents: number; currency: string; checkout_url: string; expires_in: number } | null {
  const pricing = PRICING.find(p => p.tool === tool);
  if (!pricing) return null;

  return {
    tool: pricing.tool,
    price_cents: pricing.price_cents,
    currency: pricing.currency,
    checkout_url: `${baseUrl}/api/checkout?tool=${tool}`,
    expires_in: 300,
  };
}

export async function createCheckoutSession(
  tool: string,
  stripeKey: string,
  baseUrl: string
): Promise<{ url: string; session_id: string } | { error: string }> {
  const pricing = PRICING.find(p => p.tool === tool);
  if (!pricing) return { error: "Unknown tool" };

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}&tool=${tool}`);
  params.append("cancel_url", `${baseUrl}/try`);
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][product_data][name]", `TitleWise: ${tool}`);
  params.append("line_items[0][price_data][product_data][description]", pricing.description);
  params.append("line_items[0][price_data][unit_amount]", String(pricing.price_cents));
  params.append("line_items[0][quantity]", "1");
  params.append("allow_promotion_codes", "true");
  params.append("metadata[tool]", tool);
  params.append("metadata[protocol]", "x402");
  params.append("payment_intent_data[metadata][tool]", tool);
  params.append("payment_intent_data[metadata][protocol]", "x402");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data: any = await res.json();
  if (!res.ok) {
    return { error: data.error?.message || "Stripe session creation failed" };
  }

  return { url: data.url, session_id: data.id };
}

export async function validateReceipt(
  receiptHeader: string | null,
  stripeKey?: string
): Promise<PaymentReceipt> {
  if (!receiptHeader) {
    return { valid: false, method: "none", error: "No payment receipt provided" };
  }

  const parts = receiptHeader.split(":");
  if (parts.length < 2) {
    return { valid: false, method: "unknown", error: "Invalid receipt format" };
  }

  const method = parts[0];
  const receiptId = parts.slice(1).join(":");

  if (method === "stripe" && stripeKey && receiptId.startsWith("pi_")) {
    const res = await fetch(`https://api.stripe.com/v1/payment_intents/${receiptId}`, {
      headers: { "Authorization": `Bearer ${stripeKey}` },
    });
    const pi: any = await res.json();

    if (!res.ok) {
      return { valid: false, method: "stripe", error: "Payment intent not found" };
    }

    if (pi.status === "succeeded") {
      return {
        valid: true,
        method: "stripe",
        receipt_id: receiptId,
        amount_cents: pi.amount,
      };
    }
    return { valid: false, method: "stripe", error: `Payment status: ${pi.status}` };
  }

  if (method === "stripe" && stripeKey && receiptId.startsWith("cs_")) {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${receiptId}`, {
      headers: { "Authorization": `Bearer ${stripeKey}` },
    });
    const session: any = await res.json();

    if (!res.ok) {
      return { valid: false, method: "stripe", error: "Session not found" };
    }

    if (session.payment_status === "paid") {
      return {
        valid: true,
        method: "stripe",
        receipt_id: session.payment_intent || receiptId,
        amount_cents: session.amount_total,
      };
    }
    return { valid: false, method: "stripe", error: `Session status: ${session.payment_status}` };
  }

  // x402 native format — accept if well-formed (future: validate on-chain)
  if (method === "x402" && receiptId.length > 10) {
    return { valid: true, method: "x402", receipt_id: receiptId };
  }

  return { valid: false, method, error: "Receipt validation failed" };
}

export async function retrieveCheckoutSession(
  sessionId: string,
  stripeKey: string
): Promise<{ paid: boolean; payment_intent?: string; tool?: string; amount_cents?: number }> {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { "Authorization": `Bearer ${stripeKey}` },
  });
  const session: any = await res.json();
  if (!res.ok) return { paid: false };

  return {
    paid: session.payment_status === "paid",
    payment_intent: session.payment_intent,
    tool: session.metadata?.tool,
    amount_cents: session.amount_total,
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  interval: "month";
}

export const PLANS: SubscriptionPlan[] = [
  { id: "solo", name: "Solo", price_cents: 14900, interval: "month" },
  { id: "small_firm", name: "Small Firm", price_cents: 34900, interval: "month" },
  { id: "pro", name: "Pro", price_cents: 59900, interval: "month" },
  { id: "enterprise", name: "Enterprise", price_cents: 99900, interval: "month" },
];

export async function createSubscriptionSession(
  planId: string,
  stripeKey: string,
  baseUrl: string
): Promise<{ url: string; session_id: string } | { error: string }> {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) return { error: "Unknown plan" };

  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("success_url", `${baseUrl}/api/subscribe/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`);
  params.append("cancel_url", `${baseUrl}/#pricing`);
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][product_data][name]", `TitleWise ${plan.name}`);
  params.append("line_items[0][price_data][unit_amount]", String(plan.price_cents));
  params.append("line_items[0][price_data][recurring][interval]", plan.interval);
  params.append("line_items[0][quantity]", "1");
  params.append("allow_promotion_codes", "true");
  params.append("metadata[plan]", planId);
  params.append("subscription_data[metadata][plan]", planId);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data: any = await res.json();
  if (!res.ok) {
    return { error: data.error?.message || "Stripe session creation failed" };
  }

  return { url: data.url, session_id: data.id };
}

export function build402Response(tool: string, baseUrl: string): Response {
  const quote = getQuote(tool, baseUrl);
  const pricing = getPricing();

  return new Response(JSON.stringify({
    error: "Payment Required",
    code: 402,
    message: `This tool requires payment. Price: $${(quote?.price_cents || 0) / 100} per ${PRICING.find(p => p.tool === tool)?.per || "call"}.`,
    pricing: quote,
    payment_methods: pricing.payment_methods,
    protocol: "x402",
    instructions: {
      step_1: `GET ${baseUrl}/api/quote?tool=${tool}`,
      step_2: `POST ${baseUrl}/api/checkout?tool=${tool} → returns Stripe Checkout URL`,
      step_3: "Complete payment at the Stripe URL",
      step_4: "Retry request with header: X-Payment-Receipt: stripe:<payment_intent_id>",
    },
  }), {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "X-Price": String(quote?.price_cents || 0),
      "X-Currency": "USD",
      "X-Payment-Protocol": "x402",
      "X-Checkout-URL": quote?.checkout_url || "",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
