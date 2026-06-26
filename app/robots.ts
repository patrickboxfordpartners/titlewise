import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/matters/", "/settings/", "/sign-in/", "/sign-up/"],
      },
    ],
    sitemap: "https://titlewise.app/sitemap.xml",
  }
}
