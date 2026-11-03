import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/blog",
  "/faq",
  "/demo",
  "/privacy",
  "/terms",
  "/login",
  "/signup",
  "/api/webhooks",
  // These API routes check their own credentials (CRON_SECRET, CONTENT_API_KEY,
  // API keys) or are meant to be public; a login redirect would break them.
  "/api/cron",
  "/api/health",
  "/api/blog",
  "/api/v1",
  "/api/contact",
  "/api/agent-discovery",
  "/api/stripe/webhook",
  "/api/postmark/inbound",
  "/api/auth",
  "/matter-portal",
  "/api/checklist/portal",
  "/join",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/.well-known",
  "/auth.md",
  "/about",
  "/contact",
  // MCP server: discovery (initialize, tools/list) is public; tools/call
  // checks the API key itself, the same as /api/v1.
  "/api/mcp",
]

// Agent-facing static files in public/ (llms.txt, pricing.md, index.md, ...).
const PUBLIC_FILE = /^\/[\w.-]+\.(?:md|txt|xml)$/

// Every route that exists behind login. Anything that is not public and not
// listed here does not exist, so let Next.js render a real 404 instead of
// redirecting to /login (a soft 404 that tells agents every URL is valid).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/cd-reviewer",
  "/checklist",
  "/fee-estimate",
  "/history",
  "/hoa-reviewer",
  "/matters",
  "/proration-calculator",
  "/settings",
  "/status-update",
  "/title-analysis",
  "/welcome",
  "/wire-verification",
  "/analyze",
  "/api-docs",
  "/api",
]

const MARKDOWN_PATHS = new Set(["/", "/pricing", "/faq"])
// Pages whose markdown twin is a static file in public/.
const MARKDOWN_FILES: Record<string, string> = { "/about": "/about.md", "/contact": "/contact.md" }

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"))
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_FILE.test(pathname)) return true
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  )
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Handle markdown requests
  const accept = req.headers.get("accept") || ""
  if (accept.includes("text/markdown") && MARKDOWN_PATHS.has(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = "/api/markdown"
    url.searchParams.set("path", pathname)
    return NextResponse.rewrite(url)
  }
  if (accept.includes("text/markdown") && MARKDOWN_FILES[pathname]) {
    const url = req.nextUrl.clone()
    url.pathname = MARKDOWN_FILES[pathname]
    return NextResponse.rewrite(url)
  }

  // Allow public routes
  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  // TEMP: bypass auth for local design work
  if (process.env.BYPASS_AUTH === "true") {
    return NextResponse.next()
  }

  // Require authentication for protected routes
  if (!req.auth) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
