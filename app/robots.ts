import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/sign-in/", "/sign-up/", "/matter-portal/"],
      },
    ],
    sitemap: "https://titlewise.app/sitemap.xml",
  }
}
