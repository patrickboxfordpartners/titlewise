/**
 * Create test user data in the database
 * Run with: npx tsx scripts/create-test-user.ts
 */

import { db } from "../lib/db"
import { users, matters, checklistItems } from "../lib/db/schema"

async function createTestUser() {
  const testUserId = "test_user_123"
  const testEmail = "test@titlewise.app"

  console.log("Creating test user...")

  // Insert test user
  await db.insert(users).values({
    id: testUserId,
    email: testEmail,
    firstName: "Test",
    lastName: "Attorney",
    plan: "solo",
    subscriptionStatus: "active",
    generationsUsed: 5,
    generationsLimit: 100,
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing()

  // Create a test matter
  const [matter] = await db.insert(matters).values({
    userId: testUserId,
    clientName: "John and Jane Smith",
    propertyAddress: "42 Maple Street, Portsmouth, NH 03801",
    transactionType: "Purchase",
    state: "NH",
    closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: "active",
    progressPercentage: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  // Create some checklist items
  if (matter) {
    await db.insert(checklistItems).values([
      {
        matterId: matter.id,
        title: "Order title search",
        category: "title",
        completed: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        matterId: matter.id,
        title: "Review purchase agreement",
        category: "documents",
        completed: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        matterId: matter.id,
        title: "Schedule closing",
        category: "coordination",
        completed: false,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  }

  console.log("✅ Test user created!")
  console.log("\nTo log in, use Clerk's test mode:")
  console.log(`Email: ${testEmail}`)
  console.log("User ID:", testUserId)
  console.log("\nOr create a dev bypass in middleware.ts")

  process.exit(0)
}

createTestUser().catch(console.error)
