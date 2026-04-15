import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type Stripe from "stripe"
import { logger } from "@/lib/logger"

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkId = session.metadata?.clerkId
        const plan = session.metadata?.plan
        if (!clerkId || !session.subscription || !session.customer) break

        await db.update(users)
          .set({
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionTier: plan ?? null,
            subscriptionStatus: "active",
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId))

        logger.info("stripe/webhook", "Subscription activated", { clerkId, plan })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const clerkId = subscription.metadata?.clerkId
        if (!clerkId) break

        await db.update(users)
          .set({
            subscriptionStatus: subscription.status,
            stripePriceId: subscription.items.data[0]?.price.id ?? null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId))

        logger.info("stripe/webhook", "Subscription updated", { clerkId, status: subscription.status })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const clerkId = subscription.metadata?.clerkId
        if (!clerkId) break

        await db.update(users)
          .set({
            subscriptionStatus: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId))

        logger.info("stripe/webhook", "Subscription canceled", { clerkId })
        break
      }

      default:
        break
    }
  } catch (err) {
    logger.error("stripe/webhook", `Error processing ${event.type}`, { error: String(err) })
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
