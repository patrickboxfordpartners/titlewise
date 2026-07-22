import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug))
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const apiKey = req.headers.get("x-api-key")
  if (apiKey !== process.env.CONTENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { slug } = await params
  const body = await req.json()
  const [post] = await db
    .update(blogPosts)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(blogPosts.slug, slug))
    .returning()
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}
