import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { users, processedEvents } from "@/lib/db/schema"
import { and, eq, lt } from "drizzle-orm"
import type Stripe from "stripe"
import { logger } from "@/lib/logger"
import { sendDripEmail } from "@/lib/email/drip"
import { isUniqueViolation } from "@/lib/db/errors"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    logger.error("stripe/webhook", "Signature verification failed", { error: String(err) })
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Idempotency, two rows in processed_events:
  //   "claim:<event id>"  = a delivery is processing this event right now
  //   "<event id>"        = the event finished processing
  // A retry that arrives while another delivery holds the claim gets a 409, so
  // Stripe retries later instead of us acknowledging an event that may still
  // fail. A claim older than CLAIM_TTL_MS (crashed or timed-out run) is taken over.
  const claimId = `claim:${event.id}`
  try {
    const done = await db.select({ id: processedEvents.id }).from(processedEvents)
      .where(eq(processedEvents.id, event.id)).limit(1)
    if (done.length > 0) {
      return NextResponse.json({ received: true, duplicate: true })
    }
    const claimed = await claimEvent(claimId)
    if (!claimed) {
      return NextResponse.json({ error: "Event is already being processed" }, { status: 409 })
    }
    // Another delivery may have finished (written the done row and released its
    // claim) between our first lookup and our claim. Check again.
    const doneAfterClaim = await db.select({ id: processedEvents.id }).from(processedEvents)
      .where(eq(processedEvents.id, event.id)).limit(1)
    if (doneAfterClaim.length > 0) {
      await db.delete(processedEvents).where(eq(processedEvents.id, claimId))
      return NextResponse.json({ received: true, duplicate: true })
    }
  } catch (err) {
    logger.error("stripe/webhook", "Idempotency claim failed", { error: String(err) })
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        if (!userId || !session.subscription || !session.customer) break

        await db.update(users)
          .set({
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionTier: plan ?? null,
            subscriptionStatus: "active",
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))

        logger.info("stripe/webhook", "Subscription activated", { userId, plan })

        // Send welcome drip email (non-fatal)
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
          })
          if (user?.email) {
            await sendDripEmail({
              to: user.email,
              name: user.name ?? "there",
              plan: plan ?? "solo",
              sequence: "welcome"
            })
          }
        } catch (dripErr) {
          logger.error("stripe/webhook", "Welcome drip failed (non-fatal)", { error: String(dripErr) })
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        const planFromMetadata = subscription.metadata?.plan ?? null
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null

        await db.update(users)
          .set({
            subscriptionStatus: subscription.status,
            stripePriceId: subscription.items.data[0]?.price.id ?? null,
            ...(planFromMetadata ? { subscriptionTier: planFromMetadata } : {}),
            ...(trialEnd ? { trialEndsAt: trialEnd } : {}),
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))

        logger.info("stripe/webhook", "Subscription updated", { userId, status: subscription.status })
        break
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        // Non-fatal: send reminder email via existing drip system
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
          })
          if (user?.email) {
            await sendDripEmail({
              to: user.email,
              name: user.name ?? "there",
              plan: "solo",
              sequence: "trial_ending"
            })
          }
        } catch (dripErr) {
          logger.error("stripe/webhook", "Trial ending drip failed (non-fatal)", { error: String(dripErr) })
        }

        logger.info("stripe/webhook", "Trial will end in 3 days", { userId })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        await db.update(users)
          .set({
            subscriptionStatus: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))

        logger.info("stripe/webhook", "Subscription canceled", { userId })
        break
      }

      default:
        break
    }
  } catch (err) {
    logger.error("stripe/webhook", `Error processing ${event.type}`, { error: String(err) })
    // Release the claim so Stripe's retry can process the event.
    try {
      await db.delete(processedEvents).where(eq(processedEvents.id, claimId))
    } catch (deleteErr) {
      logger.error("stripe/webhook", "Failed to release idempotency claim after error", { error: String(deleteErr) })
    }
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  // Mark done, then drop the claim. If marking done fails, keep the claim and
  // return 500 so Stripe retries; handlers are written to be safe to re-run.
  try {
    await db.insert(processedEvents).values({ id: event.id }).onConflictDoNothing()
    await db.delete(processedEvents).where(eq(processedEvents.id, claimId))
  } catch (err) {
    logger.error("stripe/webhook", "Failed to record processed event", { error: String(err) })
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

const CLAIM_TTL_MS = 5 * 60 * 1000

/** Insert the claim row. Returns false while another live delivery holds it. */
async function claimEvent(claimId: string): Promise<boolean> {
  try {
    await db.insert(processedEvents).values({ id: claimId })
    return true
  } catch (err) {
    if (!isUniqueViolation(err)) throw err
  }
  // Someone holds the claim. Take it over only if it's stale; the conditional
  // delete means just one taker wins.
  const staleBefore = new Date(Date.now() - CLAIM_TTL_MS)
  const removed = await db.delete(processedEvents)
    .where(and(eq(processedEvents.id, claimId), lt(processedEvents.processedAt, staleBefore)))
    .returning({ id: processedEvents.id })
  if (removed.length === 0) return false
  try {
    await db.insert(processedEvents).values({ id: claimId })
    return true
  } catch (err) {
    if (isUniqueViolation(err)) return false
    throw err
  }
}
