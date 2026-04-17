import type { MetadataRoute } from "next";

const SITE_URL = "https://souq.dasm.com.sa";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api and /me are either dynamic (cookie-scoped) or not useful
        // to crawlers; keep them out of the index so crawl budget goes
        // toward listing pages that actually move SEO.
        disallow: ["/api/", "/me", "/me/", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
