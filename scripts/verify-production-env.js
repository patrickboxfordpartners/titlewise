#!/usr/bin/env node

/**
 * Production Environment Verification Script
 *
 * Validates that all required production environment variables are set
 * and have the correct format before deployment.
 *
 * Usage:
 *   node scripts/verify-production-env.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Load .env.production if it exists
const envPath = path.join(__dirname, '..', '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim();
    }
  });
}

console.log(`${BLUE}╔════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BLUE}║  TitleWise Production Environment Verification        ║${RESET}`);
console.log(`${BLUE}╚════════════════════════════════════════════════════════╝${RESET}\n`);

let errors = 0;
let warnings = 0;

function checkRequired(key, format) {
  const value = process.env[key];

  if (!value || value.includes('YOUR_') || value.includes('_HERE')) {
    console.log(`${RED}✗ ${key}${RESET}`);
    console.log(`  Missing or placeholder value\n`);
    errors++;
    return false;
  }

  if (format && !format.test(value)) {
    console.log(`${RED}✗ ${key}${RESET}`);
    console.log(`  Invalid format: ${value}\n`);
    errors++;
    return false;
  }

  console.log(`${GREEN}✓ ${key}${RESET}`);
  return true;
}

function checkOptional(key, format) {
  const value = process.env[key];

  if (!value) {
    console.log(`${YELLOW}⚠ ${key}${RESET}`);
    console.log(`  Optional - not set\n`);
    warnings++;
    return false;
  }

  if (value.includes('YOUR_') || value.includes('_HERE')) {
    console.log(`${YELLOW}⚠ ${key}${RESET}`);
    console.log(`  Optional - placeholder value\n`);
    warnings++;
    return false;
  }

  if (format && !format.test(value)) {
    console.log(`${YELLOW}⚠ ${key}${RESET}`);
    console.log(`  Optional - invalid format: ${value}\n`);
    warnings++;
    return false;
  }

  console.log(`${GREEN}✓ ${key}${RESET}`);
  return true;
}

function checkTestKey(key, testPattern) {
  const value = process.env[key];
  if (value && testPattern.test(value)) {
    console.log(`${RED}✗ ${key}${RESET}`);
    console.log(`  WARNING: Using TEST key in production!\n`);
    errors++;
    return false;
  }
  return true;
}

// Clerk Authentication
console.log(`${BLUE}━━━ Clerk Authentication ━━━${RESET}\n`);
checkRequired('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', /^pk_live_/);
checkTestKey('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', /^pk_test_/);
checkRequired('CLERK_SECRET_KEY', /^sk_live_/);
checkTestKey('CLERK_SECRET_KEY', /^sk_test_/);

// Stripe
console.log(`\n${BLUE}━━━ Stripe ━━━${RESET}\n`);
checkRequired('STRIPE_SECRET_KEY', /^sk_live_/);
checkTestKey('STRIPE_SECRET_KEY', /^sk_test_/);
checkRequired('STRIPE_WEBHOOK_SECRET', /^whsec_/);
checkRequired('STRIPE_SOLO_PRICE_ID', /^price_/);
checkRequired('STRIPE_SMALL_FIRM_PRICE_ID', /^price_/);
checkRequired('STRIPE_TEAM_PRICE_ID', /^price_/);
checkOptional('STRIPE_SOLO_ANNUAL_PRICE_ID', /^price_/);
checkOptional('STRIPE_SMALL_FIRM_ANNUAL_PRICE_ID', /^price_/);
checkOptional('STRIPE_TEAM_ANNUAL_PRICE_ID', /^price_/);

// Database
console.log(`\n${BLUE}━━━ Database ━━━${RESET}\n`);
checkRequired('DATABASE_URL', /^postgresql:\/\//);

// Check if using production database (not localhost)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
  console.log(`${RED}✗ DATABASE_URL${RESET}`);
  console.log(`  WARNING: Using localhost database in production!\n`);
  errors++;
}

// Application
console.log(`\n${BLUE}━━━ Application ━━━${RESET}\n`);
checkRequired('NEXT_PUBLIC_APP_URL', /^https:\/\//);
checkRequired('NODE_ENV');

// Verify NODE_ENV is production
if (process.env.NODE_ENV !== 'production') {
  console.log(`${YELLOW}⚠ NODE_ENV${RESET}`);
  console.log(`  Expected 'production', got '${process.env.NODE_ENV}'\n`);
  warnings++;
}

// Email
console.log(`\n${BLUE}━━━ Email (Postmark) ━━━${RESET}\n`);
checkRequired('POSTMARK_API_KEY');
checkRequired('POSTMARK_FROM_EMAIL', /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);

// Check if using test Postmark key
if (process.env.POSTMARK_API_KEY === 'POSTMARK_API_TEST') {
  console.log(`${RED}✗ POSTMARK_API_KEY${RESET}`);
  console.log(`  WARNING: Using test token - emails will not be sent!\n`);
  errors++;
}

// AI Services
console.log(`\n${BLUE}━━━ AI Services ━━━${RESET}\n`);
checkRequired('ANTHROPIC_API_KEY', /^sk-ant-/);

// Analytics (optional)
console.log(`\n${BLUE}━━━ Analytics (Optional) ━━━${RESET}\n`);
checkOptional('NEXT_PUBLIC_POSTHOG_KEY', /^phc_/);
checkOptional('NEXT_PUBLIC_POSTHOG_HOST', /^https:\/\//);
checkOptional('SENTRY_DSN', /^https:\/\//);

// Summary
console.log(`\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

if (errors === 0 && warnings === 0) {
  console.log(`${GREEN}✓ All checks passed!${RESET}`);
  console.log(`${GREEN}  Production environment is properly configured.${RESET}\n`);
  process.exit(0);
} else if (errors === 0) {
  console.log(`${YELLOW}⚠ ${warnings} warning(s)${RESET}`);
  console.log(`${YELLOW}  Optional configuration missing or using placeholders.${RESET}`);
  console.log(`${YELLOW}  Safe to deploy, but consider completing optional config.${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}✗ ${errors} error(s), ${warnings} warning(s)${RESET}`);
  console.log(`${RED}  Production environment is NOT ready for deployment.${RESET}`);
  console.log(`${RED}  Fix the errors above before deploying.${RESET}\n`);
  console.log(`See ${BLUE}PRODUCTION_DEPLOYMENT.md${RESET} for setup instructions.\n`);
  process.exit(1);
}
