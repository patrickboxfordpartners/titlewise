#!/usr/bin/env tsx

/**
 * Manually sync Stripe subscription to database
 * Use when webhook fails to fire
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
const CUSTOMER_ID = 'cus_UPhuqWcga9xIet'; // Most recent one
const CLERK_ID = 'user_3CwgYbYWM2h6vmkj2suif6qWP60';
const SUBSCRIPTION_TIER = 'small_firm';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  console.log('\n🔄 Syncing subscription to database\n');

  const sql = neon(DATABASE_URL!);
  const db = drizzle(sql, { schema: { users } });

  // Get the Stripe subscription details
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });

  console.log('📡 Fetching subscription from Stripe...');
  const customer = await stripe.customers.retrieve(CUSTOMER_ID, {
    expand: ['subscriptions'],
  });

  if (!customer || customer.deleted) {
    console.error('❌ Customer not found');
    process.exit(1);
  }

  const subscriptions = (customer as any).subscriptions.data;
  if (subscriptions.length === 0) {
    console.error('❌ No subscriptions found');
    process.exit(1);
  }

  const subscription = subscriptions[0];
  const priceId = subscription.items.data[0]?.price.id;

  console.log(`✓ Found subscription: ${subscription.id}`);
  console.log(`✓ Status: ${subscription.status}`);
  console.log(`✓ Price: ${priceId}`);

  // Update database
  console.log('\n💾 Updating database...');
  await db
    .update(users)
    .set({
      stripeCustomerId: CUSTOMER_ID,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      subscriptionTier: SUBSCRIPTION_TIER,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, CLERK_ID));

  console.log('✅ Subscription synced successfully!\n');
  console.log('User details:');
  console.log(`  Clerk ID: ${CLERK_ID}`);
  console.log(`  Customer ID: ${CUSTOMER_ID}`);
  console.log(`  Subscription ID: ${subscription.id}`);
  console.log(`  Tier: ${SUBSCRIPTION_TIER}`);
  console.log(`  Status: ${subscription.status}\n`);
  console.log('🎉 Refresh your dashboard to see the active subscription!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
