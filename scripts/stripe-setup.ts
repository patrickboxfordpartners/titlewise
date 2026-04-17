/**
 * Stripe product/price setup script for TitleWise.
 * Run once per Stripe account to create the product, prices, and portal config.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *
 * Output: prints the env vars to paste into .env.local
 */

import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error("STRIPE_SECRET_KEY is required")
  process.exit(1)
}

const stripe = new Stripe(key)

const plans = [
  { key: "solo", tier: "solo", monthly: 9900, annual: 95040 },
  { key: "small_firm", tier: "small_firm", monthly: 24900, annual: 238800 },
  { key: "team", tier: "team", monthly: 49900, annual: 479040 },
] as const

async function main() {
  console.log("Creating TitleWise product...")
  const product = await stripe.products.create({
    name: "TitleWise",
    description: "AI tools for real estate closing attorneys",
  })

  console.log("Creating monthly and annual prices...")
  const prices: Record<string, { monthly: string; annual: string }> = {}

  for (const plan of plans) {
    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthly,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { tier: plan.tier },
      lookup_key: `titlewise_${plan.key}_monthly`,
    })

    const annual = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annual,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { tier: plan.tier },
      lookup_key: `titlewise_${plan.key}_annual`,
    })

    prices[plan.key] = { monthly: monthly.id, annual: annual.id }
  }

  console.log("Configuring customer portal...")
  await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "TitleWise — Manage your subscription",
    },
    features: {
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
    },
  })

  console.log("\n--- Add these to .env.local and Vercel ---\n")
  console.log(`STRIPE_SOLO_PRICE_ID=${prices.solo.monthly}`)
  console.log(`STRIPE_SOLO_ANNUAL_PRICE_ID=${prices.solo.annual}`)
  console.log(`STRIPE_SMALL_FIRM_PRICE_ID=${prices.small_firm.monthly}`)
  console.log(`STRIPE_SMALL_FIRM_ANNUAL_PRICE_ID=${prices.small_firm.annual}`)
  console.log(`STRIPE_TEAM_PRICE_ID=${prices.team.monthly}`)
  console.log(`STRIPE_TEAM_ANNUAL_PRICE_ID=${prices.team.annual}`)
  console.log(`\nProduct ID: ${product.id}`)
}

main().catch((e) => {
  console.error("Setup failed:", e.message)
  process.exit(1)
})
