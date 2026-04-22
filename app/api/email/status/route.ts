import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)
  return NextResponse.json({
    google: !!user.googleRefreshToken,
    outlook: !!user.outlookRefreshToken,
    outlookAvailable: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
  })
}
