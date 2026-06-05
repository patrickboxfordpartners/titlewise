import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/stripe/webhook",
  "/api/postmark/inbound",
  "/matter-portal(.*)",
  "/api/checklist/portal",
  "/join(.*)",
])

// API routes handle their own auth and return 401 JSON — don't let Clerk
// rewrite them to the sign-in page, which breaks JSON clients.
const isApiRoute = createRouteMatcher(["/api/(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req) && !isApiRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
