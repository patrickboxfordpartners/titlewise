import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrCreateUser, getTrialStatus } from "@/lib/db/get-user"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ isTrial: false, daysRemaining: 0 })
  const user = await getOrCreateUser(userId)
  return NextResponse.json(getTrialStatus(user))
}
