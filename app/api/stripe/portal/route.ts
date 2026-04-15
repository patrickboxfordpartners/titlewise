import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { env } from "@/lib/env"

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userRows = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1)
  if (userRows.length === 0 || !userRows[0].stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found. Subscribe first." }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: userRows[0].stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
