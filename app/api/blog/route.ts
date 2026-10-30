import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { secretsMatch } from "@/lib/secret-compare"

export const dynamic = "force-dynamic"

/** Return metadata for the latest 100 published posts with shared-cache headers. */
export async function GET() {
  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      author: blogPosts.author,
      authorUrl: blogPosts.authorUrl,
      category: blogPosts.category,
      readTime: blogPosts.readTime,
      brand: blogPosts.brand,
      tags: blogPosts.tags,
      status: blogPosts.status,
      canonical: blogPosts.canonical,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(100)
  return NextResponse.json(posts, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  })
}

/** Create a blog post after validating the content API key. */
export async function POST(req: NextRequest) {
  if (!secretsMatch(req.headers.get("x-api-key"), process.env.CONTENT_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
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
  } catch (err) {
    console.error("[blog] POST error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
