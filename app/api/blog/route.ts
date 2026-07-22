import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  if (apiKey !== process.env.CONTENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json()
  const [post] = await db.insert(blogPosts).values({
    slug: body.slug,
    title: body.title,
    excerpt: body.excerpt,
    body: body.body,
    category: body.category ?? "Insights",
    readTime: body.readTime ?? body.read_time ?? "5 min read",
    brand: body.brand ?? "titlewise",
    status: body.status ?? "published",
    canonical: body.canonical ?? null,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
  }).returning()
  return NextResponse.json(post, { status: 201 })
}
