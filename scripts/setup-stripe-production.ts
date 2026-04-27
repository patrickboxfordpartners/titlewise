#!/usr/bin/env tsx

/**
 * Stripe Production Setup Script
 *
 * Creates products and prices in Stripe Production mode to match test setup.
 *
 * Prerequisites:
 * 1. Switch your Stripe dashboard to "Production" mode
 * 2. Get your production secret key: sk_live_...
 * 3. Run: STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/setup-stripe-production.ts
 *
 * This script will:
 * - Create 3 products (Solo, Small Firm, Team)
 * - Create monthly and annual prices for each
 * - Output the price IDs to copy into .env.production
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable not set');
  console.error('\nUsage:');
  console.error('  STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/setup-stripe-production.ts\n');
  process.exit(1);
}

if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error('❌ Error: You provided a TEST key (sk_test_...)');
  console.error('   This script is for PRODUCTION setup only.');
  console.error('   Switch to Production mode in Stripe dashboard and use sk_live_...\n');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

const PRODUCTS = [
  {
    key: 'solo',
    name: 'TitleWise Solo',
    description: 'For solo practitioners',
    monthlyPrice: 9900, // $99.00 in cents
    annualPrice: 7900,  // $79.00 in cents (20% off)
    features: [
      '1 attorney seat',
      'All 8 AI tools',
      'History & re-generate',
      'PDF export',
      'Email support',
    ],
  },
  {
    key: 'small_firm',
    name: 'TitleWise Small Firm',
    description: 'Up to 5 attorneys',
    monthlyPrice: 24900, // $249.00
    annualPrice: 19900,  // $199.00 (20% off)
    features: [
      'Up to 5 attorney seats',
      'All Solo features',
      'Shared history across firm',
      'Priority email support',
    ],
  },
  {
    key: 'team',
    name: 'TitleWise Team',
    description: 'Up to 15 attorneys',
    monthlyPrice: 49900, // $499.00
    annualPrice: 39900,  // $399.00 (20% off)
    features: [
      'Up to 15 attorney seats',
      'All Small Firm features',
      'API access',
      'Dedicated onboarding',
      'Priority support',
    ],
  },
];

async function main() {
  console.log('\n🔵 TitleWise Stripe Production Setup\n');
  console.log('Creating products and prices in PRODUCTION mode...\n');

  const results: Record<string, { productId: string; monthlyPriceId: string; annualPriceId: string }> = {};

  for (const product of PRODUCTS) {
    console.log(`📦 Creating product: ${product.name}`);

    // Create product
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: {
        plan_key: product.key,
        features: product.features.join(' | '),
      },
    });

    console.log(`   ✅ Product created: ${stripeProduct.id}`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.monthlyPrice,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_key: product.key,
        billing_period: 'monthly',
      },
    });

    console.log(`   ✅ Monthly price created: ${monthlyPrice.id} ($${product.monthlyPrice / 100}/mo)`);

    // Create annual price
    const annualPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.annualPrice,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_key: product.key,
        billing_period: 'annual',
        savings: `$${((product.monthlyPrice - product.annualPrice) * 12) / 100}/yr`,
      },
    });

    console.log(`   ✅ Annual price created: ${annualPrice.id} ($${product.annualPrice}/mo)\n`);

    results[product.key] = {
      productId: stripeProduct.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    };
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ All products and prices created successfully!\n');
  console.log('📋 Copy these values to your .env.production file:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`# Stripe Production Price IDs`);
  console.log(`STRIPE_SOLO_PRICE_ID=${results.solo.monthlyPriceId}`);
  console.log(`STRIPE_SOLO_ANNUAL_PRICE_ID=${results.solo.annualPriceId}`);
  console.log(`STRIPE_SMALL_FIRM_PRICE_ID=${results.small_firm.monthlyPriceId}`);
  console.log(`STRIPE_SMALL_FIRM_ANNUAL_PRICE_ID=${results.small_firm.annualPriceId}`);
  console.log(`STRIPE_TEAM_PRICE_ID=${results.team.monthlyPriceId}`);
  console.log(`STRIPE_TEAM_ANNUAL_PRICE_ID=${results.team.annualPriceId}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 Next Steps:\n');
  console.log('1. Set up webhook endpoint:');
  console.log('   URL: https://titlewise.app/api/stripe/webhook');
  console.log('   Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted\n');
  console.log('2. Copy the webhook signing secret to .env.production:');
  console.log('   STRIPE_WEBHOOK_SECRET=whsec_...\n');
  console.log('3. Run verification:');
  console.log('   npm run verify:prod\n');
  console.log('4. Deploy to production!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
