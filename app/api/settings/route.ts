import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  firmName: z.string().optional(),
  customLogoUrl: z.string().url().or(z.literal("")).nullable().optional(),
})

export async function GET() {
  const userId = await requireAuth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await getOrCreateUser(userId)
  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      firmName: user.firmName,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionTier: user.subscriptionTier,
      monthlyUsageCount: user.monthlyUsageCount,
      hasStripeCustomer: !!user.stripeCustomerId,
      onboardingCompletedAt: user.onboardingCompletedAt,
      customLogoUrl: user.customLogoUrl,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  await db.update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, userId))

  return NextResponse.json({ ok: true })
}
