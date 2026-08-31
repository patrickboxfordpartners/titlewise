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
]

const MARKDOWN_PATHS = new Set(["/", "/pricing", "/faq"])

function isPublicPath(pathname: string): boolean {
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

  // Allow public routes
  if (isPublicPath(pathname)) {
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
