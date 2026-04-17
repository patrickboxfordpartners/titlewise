import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { stripe } from "@/lib/stripe"
import { PLANS, type PlanKey } from "@/lib/plans"
import { getOrCreateUser } from "@/lib/db/get-user"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  plan: z.enum(["solo", "small_firm", "team"] as const),
  annual: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
  }

  const planKey = parsed.data.plan as PlanKey
  const plan = PLANS[planKey]
  const priceId = parsed.data.annual ? plan.annualPriceId : plan.monthlyPriceId
  if (!priceId) {
    return NextResponse.json({ error: "Plan not configured yet" }, { status: 400 })
  }

  try {
    const user = await getOrCreateUser(userId)

    // If user already has a Stripe customer, reuse it
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { clerkId: userId, titlewiseUserId: user.id },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: { plan: planKey, clerkId: userId },
      },
      metadata: { clerkId: userId, plan: planKey },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error("stripe/checkout", "Checkout session error", { error: String(err) })
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
