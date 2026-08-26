import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/blog(.*)",
  "/faq(.*)",
  "/demo(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/stripe/webhook",
  "/api/postmark/inbound",
  "/matter-portal(.*)",
  "/api/checklist/portal",
  "/join(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/.well-known(.*)",
  "/auth.md",
])

// API routes handle their own auth and return 401 JSON — don't let Clerk
// rewrite them to the sign-in page, which breaks JSON clients.
const isApiRoute = createRouteMatcher(["/api/(.*)"])

const MARKDOWN_PATHS = new Set(["/", "/pricing", "/faq"])

export default clerkMiddleware(async (auth, req) => {
  const accept = req.headers.get("accept") || ""
  if (accept.includes("text/markdown") && MARKDOWN_PATHS.has(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = "/api/markdown"
    url.searchParams.set("path", req.nextUrl.pathname)
    return NextResponse.rewrite(url)
  }

  if (!isPublicRoute(req) && !isApiRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
