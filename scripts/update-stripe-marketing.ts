#!/usr/bin/env tsx

/**
 * Update Stripe Products with Marketing Content for Checkout
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY || !STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  console.error('❌ Error: STRIPE_SECRET_KEY must be production key');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

const PRODUCTS = {
  solo: {
    name: 'TitleWise Solo',
    description: 'Everything you need to automate your closing workflow. AI-powered document analysis, compliance checks, and client communications — all in one platform designed for solo practitioners.',
    marketing_features: [
      { name: '✓ 100 AI generations per month' },
      { name: '✓ All 12 closing automation tools' },
      { name: '✓ State-specific checklists (7 states)' },
      { name: '✓ Document analysis & generation' },
      { name: '✓ Wire fraud protection' },
      { name: '✓ PDF export on all outputs' },
      { name: '✓ Full-text search & filters' },
      { name: '✓ Email support' },
    ],
  },
  small_firm: {
    name: 'TitleWise Small Firm',
    description: 'Built for growing firms. Share knowledge across your team, give clients real-time access to their matters, and protect against wire fraud with institutional memory. Perfect for 2-5 attorneys.',
    marketing_features: [
      { name: '✓ Up to 5 attorney seats' },
      { name: '✓ 500 AI generations per month' },
      { name: '✓ All Solo features included' },
      { name: '✓ Shared history across team' },
      { name: '✓ Branded client portal' },
      { name: '✓ Wire fraud memory system' },
      { name: '✓ Team invitations & management' },
      { name: '✓ Priority email support' },
    ],
  },
  pro: {
    name: 'TitleWise Pro',
    description: 'The complete platform with autonomous AI. Your closing agent handles routine tasks automatically, TRID compliance is built-in, and your team of up to 10 attorneys works from one source of truth.',
    marketing_features: [
      { name: '✓ Up to 10 attorney seats' },
      { name: '✓ 1,500 AI generations per month' },
      { name: '✓ All Small Firm features' },
      { name: '✓ Autonomous closing agent' },
      { name: '✓ TRID compliance engine' },
      { name: '✓ Document version history' },
      { name: '✓ API access for integrations' },
      { name: '✓ Priority support (2hr response)' },
    ],
  },
  enterprise: {
    name: 'TitleWise Enterprise',
    description: 'Maximum power and customization for large firms. Handle 5,000 closings per month across 25 attorneys, integrate with your existing systems, and get dedicated support from a team that knows your workflow.',
    marketing_features: [
      { name: '✓ Up to 25 attorney seats' },
      { name: '✓ 5,000 AI generations per month' },
      { name: '✓ All Pro features included' },
      { name: '✓ Custom API integrations' },
      { name: '✓ Dedicated account manager' },
      { name: '✓ SLA guarantee (99.9% uptime)' },
      { name: '✓ White-glove onboarding' },
      { name: '✓ Custom training for your team' },
    ],
  },
};

async function main() {
  console.log('\n🎨 Updating Stripe Marketing Content\n');

  const products = await stripe.products.list({ limit: 100 });

  for (const [key, data] of Object.entries(PRODUCTS)) {
    const product = products.data.find(p => p.name === data.name);

    if (!product) {
      console.log(`⚠️  ${data.name} not found`);
      continue;
    }

    console.log(`📦 Updating: ${data.name}`);

    await stripe.products.update(product.id, {
      description: data.description,
      marketing_features: data.marketing_features,
      statement_descriptor: 'TITLEWISE',
    });

    console.log(`   ✅ Marketing content updated`);
  }

  console.log('\n✅ All products updated with marketing content!\n');
  console.log('The checkout page will now show:');
  console.log('  • Detailed product description');
  console.log('  • Feature list with checkmarks');
  console.log('  • TitleWise logo\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
