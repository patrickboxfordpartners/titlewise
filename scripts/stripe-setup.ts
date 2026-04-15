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

async function main() {
  console.log("Creating TitleWise product...")
  const product = await stripe.products.create({
    name: "TitleWise",
    description: "AI tools for real estate closing attorneys",
  })

  console.log("Creating prices...")
  const solo = await stripe.prices.create({
    product: product.id,
    unit_amount: 9900,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "solo" },
    lookup_key: "titlewise_solo_monthly",
  })

  const smallFirm = await stripe.prices.create({
    product: product.id,
    unit_amount: 24900,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "small_firm" },
    lookup_key: "titlewise_small_firm_monthly",
  })

  const team = await stripe.prices.create({
    product: product.id,
    unit_amount: 49900,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "team" },
    lookup_key: "titlewise_team_monthly",
  })

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

  console.log("\n--- Add these to .env.local ---\n")
  console.log(`STRIPE_SOLO_PRICE_ID=${solo.id}`)
  console.log(`STRIPE_SMALL_FIRM_PRICE_ID=${smallFirm.id}`)
  console.log(`STRIPE_TEAM_PRICE_ID=${team.id}`)
  console.log(`\nProduct ID: ${product.id}`)
}

main().catch((e) => {
  console.error("Setup failed:", e.message)
  process.exit(1)
})
