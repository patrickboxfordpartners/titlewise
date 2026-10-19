import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { secretsMatch } from "@/lib/secret-compare"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ slug: string }> }

/** Return a post by slug; require the content API key to include unpublished posts. */
export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = await params
  // Drafts are only visible to the content pipeline (CONTENT_API_KEY).
  const canSeeDrafts = secretsMatch(req.headers.get("x-api-key"), process.env.CONTENT_API_KEY)
  const where = canSeeDrafts
    ? eq(blogPosts.slug, slug)
    : and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published"))
  const [post] = await db.select().from(blogPosts).where(where)
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}

/** Update a blog post by slug after validating the content API key. */
export async function PATCH(req: NextRequest, { params }: Props) {
  if (!secretsMatch(req.headers.get("x-api-key"), process.env.CONTENT_API_KEY)) {
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
