#!/usr/bin/env tsx

/**
 * Update Stripe Product Branding and Details
 *
 * Run: STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/update-stripe-branding.ts
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY || !STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  console.error('❌ Error: STRIPE_SECRET_KEY must be set to production key (sk_live_...)');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

const PRODUCT_UPDATES = {
  solo: {
    name: 'TITLEwise Solo',
    description: 'AI-powered closing platform for solo practitioners. Includes all 12 core tools, 100 AI generations per month, and email support.',
    features: [
      { name: '1 attorney seat' },
      { name: '100 AI generations per month' },
      { name: 'All 12 core closing tools' },
      { name: 'State-specific checklists (7 states)' },
      { name: 'Document analysis & generation' },
      { name: 'PDF export on all tools' },
      { name: 'Full-text search & date filters' },
      { name: 'Email support' },
    ],
  },
  small_firm: {
    name: 'TITLEwise Small Firm',
    description: 'Built for growing firms. Up to 5 attorneys with shared history, client portals, and wire fraud protection.',
    features: [
      { name: 'Up to 5 attorney seats' },
      { name: '500 AI generations per month' },
      { name: 'All Solo features' },
      { name: 'Shared history across firm' },
      { name: 'Client matter portal' },
      { name: 'Wire fraud institutional memory' },
      { name: 'Team invitations & seat management' },
      { name: 'Priority email support' },
    ],
  },
  pro: {
    name: 'TITLEwise Pro',
    description: 'Full platform with autonomous AI agent. TRID compliance engine, 1,500 generations, and priority support for up to 10 attorneys.',
    features: [
      { name: 'Up to 10 attorney seats' },
      { name: '1,500 AI generations per month' },
      { name: 'All Small Firm features' },
      { name: 'Autonomous closing agent' },
      { name: 'TRID compliance engine' },
      { name: 'Document version history' },
      { name: 'API access' },
      { name: 'Priority support' },
    ],
  },
  enterprise: {
    name: 'TITLEwise Enterprise',
    description: 'Unlimited power for large firms. 25 seats, 5,000 generations, custom integrations, and dedicated account management.',
    features: [
      { name: 'Up to 25 attorney seats' },
      { name: '5,000 AI generations per month' },
      { name: 'All Pro features' },
      { name: 'Custom integrations' },
      { name: 'Dedicated account manager' },
      { name: 'SLA guarantee' },
      { name: 'White-glove onboarding' },
      { name: 'Custom training sessions' },
    ],
  },
};

async function main() {
  console.log('\n🎨 Updating Stripe Product Branding\n');

  // List all products to find the ones we created
  const products = await stripe.products.list({ limit: 100 });

  for (const [key, updates] of Object.entries(PRODUCT_UPDATES)) {
    // Find product by name
    const product = products.data.find(p => p.name === updates.name);

    if (!product) {
      console.log(`⚠️  Product not found: ${updates.name} - skipping`);
      continue;
    }

    console.log(`\n📦 Updating: ${updates.name}`);

    // Update product with description
    await stripe.products.update(product.id, {
      description: updates.description,
      metadata: {
        plan_key: key,
        updated_at: new Date().toISOString(),
        features: updates.features.map(f => f.name).join(' | '),
      },
    });

    console.log(`   ✅ Updated product details`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ All products updated!\n');
  console.log('📌 Next: Update account-level branding\n');
  console.log('Go to Stripe Dashboard → Settings → Branding:');
  console.log('  1. Icon: Upload TITLEwise logo');
  console.log('  2. Brand color: #2563eb (or your primary color)');
  console.log('  3. Accent color: #1e40af');
  console.log('  4. Save changes\n');
  console.log('Then test checkout again - products will show full details.\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
