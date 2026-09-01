import type { Metadata } from "next"
import Link from "next/link"
import { getAllPosts } from "@/lib/posts"
import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"
import Breadcrumbs from "@/components/landing/Breadcrumbs"

export const metadata: Metadata = {
  title: "Blog | TITLEwise",
  description: "Insights on AI document review, real estate closings, and how title attorneys are using AI to handle pattern work faster.",
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      <LandingNav />

      <div className="max-w-[1060px] mx-auto px-8 pt-32 pb-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
        {/* Header */}
        <div className="mb-16 mt-8">
          <p style={{
            fontSize: "0.75rem",
            fontWeight: 400,
            color: "var(--primary)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            Blog
          </p>
          <h1 style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 300,
            letterSpacing: "-1.4px",
            lineHeight: 1.1,
            color: "var(--foreground)",
            marginBottom: 16,
          }}>
            Insights for closing attorneys
          </h1>
          <p style={{
            fontSize: "1rem",
            fontWeight: 300,
            color: "var(--muted-foreground)",
            lineHeight: 1.7,
            maxWidth: 520,
          }}>
            AI document review, real estate closings, and how title attorneys are using AI to handle pattern work faster.
          </p>
        </div>

        {/* Post list or empty state */}
        {posts.length === 0 ? (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 48, textAlign: "center" }}>
            <p style={{ fontSize: "1rem", fontWeight: 300, color: "var(--muted-foreground)" }}>Articles coming soon.</p>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {posts.map((post) => (
              <article key={post.slug} style={{ borderBottom: "1px solid var(--border)", padding: "40px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{
                    fontSize: "0.6875rem",
                    fontWeight: 400,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--primary)",
                  }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 300, color: "var(--muted-foreground)" }}>·</span>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 300, color: "var(--muted-foreground)" }}>
                    {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 300, color: "var(--muted-foreground)" }}>·</span>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 300, color: "var(--muted-foreground)" }}>{post.readTime}</span>
                </div>
                <h2 style={{
                  fontSize: "1.25rem",
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  color: "var(--foreground)",
                  marginBottom: 10,
                }}>
                  {post.title}
                </h2>
                <p style={{
                  fontSize: "0.9375rem",
                  fontWeight: 300,
                  color: "var(--muted-foreground)",
                  lineHeight: 1.65,
                  maxWidth: 680,
                  marginBottom: 20,
                }}>
                  {post.description}
                </p>
                <Link href={`/blog/${post.slug}`} style={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--primary)",
                  textDecoration: "none",
                }}>
                  Read more &rarr;
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      <LandingFooter />
    </div>
  )
}
