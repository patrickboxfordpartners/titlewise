import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/.well-known/ard.json",
        destination: "/api/serve-orank?path=/.well-known/ard.json",
      },
      {
        source: "/.well-known/agent-card.json",
        destination: "/api/serve-orank?path=/.well-known/agent-card.json",
      },
      {
        source: "/.well-known/oauth-authorization-server",
        destination: "/api/serve-orank?path=/.well-known/oauth-authorization-server",
      },
      {
        source: "/pricing.md",
        destination: "/api/serve-orank?path=/pricing.md",
      },
      {
        source: "/about.md",
        destination: "/api/serve-orank?path=/about.md",
      },
      {
        source: "/contact.md",
        destination: "/api/serve-orank?path=/contact.md",
      },
      {
        source: "/privacy.md",
        destination: "/api/serve-orank?path=/privacy.md",
      },
      {
        source: "/index.md",
        destination: "/api/serve-orank?path=/index.md",
      },
      {
        source: "/auth.md",
        destination: "/api/serve-orank?path=/auth.md",
      },
      {
        source: "/schemamap.xml",
        destination: "/api/serve-orank?path=/schemamap.xml",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://analytics.boxfordpartners.com https://va.vercel-scripts.com https://*.clerk.accounts.dev https://clerk.titlewise.app https://static.cloudflareinsights.com https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline' https://fonts.bunny.net; font-src 'self' https://fonts.bunny.net; img-src 'self' data: blob: https://img.clerk.com; connect-src 'self' https://analytics.boxfordpartners.com https://*.clerk.accounts.dev https://clerk.titlewise.app https://va.vercel-scripts.com https://static.cloudflareinsights.com https://*.neon.tech https://us.i.posthog.com https://us-assets.i.posthog.com; frame-src https://*.clerk.accounts.dev https://clerk.titlewise.app; object-src 'none'; base-uri 'self'",
          },
        ],
      },
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: '</.well-known/api-catalog>; rel="api-catalog", </auth.md>; rel="service-doc", </.well-known/mcp/server-card.json>; rel="mcp-server-card", </.well-known/agent-skills/index.json>; rel="agent-skills", </llms.txt>; rel="llms-txt"',
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: "titlewise",
  project: "titlewise-app",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
})
