import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { PLANS, type PlanKey } from "@/lib/plans"
import { getOrCreateUser } from "@/lib/db/get-user"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/logger"

const VALID_PLANS = ["solo", "small_firm", "pro", "enterprise"] as const
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://titlewise.app"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", APP_URL))
  }

  const planParam = req.nextUrl.searchParams.get("plan")
  if (!planParam || !(VALID_PLANS as readonly string[]).includes(planParam)) {
    return NextResponse.redirect(new URL("/pricing", APP_URL))
  }
  const plan = planParam as PlanKey

  try {
    const user = await getOrCreateUser(userId)

    // Create or reuse Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { clerkId: userId, titlewiseUserId: user.id },
      })
      customerId = customer.id
      await db.update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, user.id))
    }

    if (plan === "solo") {
      // Create trial subscription — no payment method required
      const priceId = PLANS.solo.monthlyPriceId
      if (!priceId) {
        logger.error("post-signup", "Solo price ID not configured", {})
        return NextResponse.redirect(new URL("/pricing", APP_URL))
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: 7,
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: { clerkId: userId, plan: "solo" },
        expand: ["latest_invoice"],
      })

      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await db.update(users)
        .set({
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          subscriptionTier: "solo",
          subscriptionStatus: "trialing",
          trialEndsAt: trialEnd,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      logger.info("post-signup", "Trial activated", { userId, plan: "solo", trialEnd: trialEnd.toISOString() })
      return NextResponse.redirect(new URL("/dashboard", APP_URL))
    }

    // Paid plan — Stripe Checkout
    const planConfig = PLANS[plan]
    const priceId = planConfig.monthlyPriceId
    if (!priceId) {
      logger.error("post-signup", `Price ID not configured for plan: ${plan}`, {})
      return NextResponse.redirect(new URL("/pricing", APP_URL))
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?subscribed=true`,
      cancel_url: `${APP_URL}/pricing`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { plan, clerkId: userId },
        description: `TitleWise ${planConfig.name} - ${planConfig.description}`,
      },
      metadata: { clerkId: userId, plan },
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
      phone_number_collection: { enabled: true },
      custom_text: {
        submit: { message: "Start your TitleWise subscription today. Cancel anytime." },
      },
    })

    if (!session.url) {
      logger.error("post-signup", "No checkout session URL returned", {})
      return NextResponse.redirect(new URL("/pricing", APP_URL))
    }

    logger.info("post-signup", "Checkout session created", { userId, plan })
    return NextResponse.redirect(session.url)
  } catch (err) {
    logger.error("post-signup", "Error in post-signup route", { error: String(err) })
    return NextResponse.redirect(new URL("/pricing", APP_URL))
  }
}
