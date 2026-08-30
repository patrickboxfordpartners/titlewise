import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPost, getAllPosts } from "@/lib/posts"
import BlogFAQ from "@/components/BlogFAQ"
import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"
import Breadcrumbs from "@/components/landing/Breadcrumbs"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}

  const canonical = post.canonical ?? `https://titlewise.app/blog/${post.slug}`

  return {
    title: `${post.title} | TitleWise`,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: canonical,
      siteName: "TitleWise",
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const canonical = post.canonical ?? `https://titlewise.app/blog/${post.slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
      url: post.authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "TitleWise",
      url: "https://titlewise.app",
    },
    url: canonical,
    mainEntityOfPage: canonical,
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-sans)", WebkitFontSmoothing: "antialiased" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Prose styles for article body HTML */}
      <style>{`
        .tw-prose h2 {
          font-size: 1.125rem;
          font-weight: 300;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #0d253d;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .tw-prose h3 {
          font-size: 1rem;
          font-weight: 300;
          color: #0d253d;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        .tw-prose p {
          font-size: 1rem;
          font-weight: 300;
          line-height: 1.85;
          color: #0d253d;
          margin-bottom: 1.25rem;
          margin-top: 0;
        }
        .tw-prose ul, .tw-prose ol {
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .tw-prose li {
          font-size: 1rem;
          font-weight: 300;
          line-height: 1.8;
          color: #0d253d;
          margin-bottom: 0.35rem;
        }
        .tw-prose a {
          color: #533afd;
          text-decoration: underline;
        }
        .tw-prose strong {
          font-weight: 400;
          color: #0d253d;
        }
        .tw-prose blockquote {
          border-left: 3px solid #533afd;
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          color: #64748d;
          font-weight: 300;
          font-style: italic;
        }
      `}</style>

      <LandingNav />

      {/* Hero — dark navy, full-width */}
      <section style={{
        backgroundColor: "var(--section-dark)",
        padding: "128px 32px 80px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />
          </div>

          {/* Category + date pill */}
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(83,58,253,0.15)",
              border: "1px solid rgba(83,58,253,0.3)",
              borderRadius: 999,
              padding: "5px 14px",
              fontSize: "0.6875rem",
              fontWeight: 400,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#533afd",
            }}>
              {post.category}
              <span style={{ color: "rgba(237,238,240,0.3)", fontWeight: 300 }}>·</span>
              <span style={{ color: "rgba(237,238,240,0.5)", textTransform: "none", fontWeight: 300, letterSpacing: 0 }}>
                {post.date}
              </span>
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 300,
            letterSpacing: "-1.4px",
            lineHeight: 1.1,
            textTransform: "uppercase",
            color: "#ffffff",
            marginBottom: 28,
          }}>
            {post.title}
          </h1>

          {/* Author byline */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap" as const,
          }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 300, color: "rgba(237,238,240,0.4)" }}>By</span>
            <a
              href={post.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.8125rem", color: "#ffffff", textDecoration: "none", fontWeight: 300 }}
            >
              {post.author}
            </a>
            <span style={{ fontSize: "0.8125rem", fontWeight: 300, color: "rgba(237,238,240,0.4)" }}>·</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 300, color: "rgba(237,238,240,0.4)" }}>{post.date}</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 300, color: "rgba(237,238,240,0.4)" }}>·</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 300, color: "rgba(237,238,240,0.4)" }}>{post.readTime}</span>
          </div>
        </div>
      </section>

      {/* Direct Answer box */}
      <section style={{
        backgroundColor: "#f5e9d4",
        borderTop: "1px solid rgba(83,58,253,0.12)",
        borderBottom: "1px solid rgba(83,58,253,0.12)",
        padding: "40px 32px",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ borderLeft: "4px solid #533afd", paddingLeft: 20 }}>
            <p style={{
              fontSize: "0.6875rem",
              fontWeight: 300,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--primary)",
              marginBottom: 10,
            }}>
              Direct Answer
            </p>
            <p style={{
              fontSize: "1rem",
              lineHeight: 1.75,
              color: "var(--foreground)",
              margin: 0,
            }}>
              {post.description}
            </p>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article style={{ backgroundColor: "var(--background)", padding: "56px 32px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            className="tw-prose"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </div>
      </article>

      <BlogFAQ />

      {/* Bottom CTA block — dark navy */}
      <section style={{
        backgroundColor: "var(--section-dark)",
        padding: "80px 32px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{
            fontSize: "0.6875rem",
            fontWeight: 300,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--primary)",
            marginBottom: 20,
          }}>
            TitleWise
          </p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 300,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            lineHeight: 1.1,
            color: "#EDEEF0",
            marginBottom: 20,
          }}>
            Ready to close faster?
          </h2>
          <p style={{
            fontSize: "0.9375rem",
            color: "rgba(237,238,240,0.55)",
            lineHeight: 1.7,
            marginBottom: 36,
          }}>
            AI document review for real estate closing attorneys. Pattern work handled automatically. Attorneys focus on judgment.
          </p>
          <Link href="/sign-up" style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize: "0.9375rem",
            fontWeight: 300,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            padding: "14px 36px",
            borderRadius: 9999,
            textDecoration: "none",
          }}>
            Try TitleWise Free
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
