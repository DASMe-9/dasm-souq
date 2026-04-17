/**
 * Dynamic sitemap.xml — souq.dasm.com.sa/sitemap.xml
 *
 * Emits:
 *   • static landing pages (/, /listings, /publish, /pricing)
 *   • one URL per active marketplace_listing (up to 50k — Google's
 *     hard cap per sitemap)
 *   • one URL per active market section (/s/{slug})
 *
 * Listings dominate the list, so we batch-fetch them directly from
 * Supabase instead of paginating through /api/v1/listings. If the DB
 * is unreachable the sitemap still ships with the static pages — we
 * never want to return a 500 to search engines.
 */

import type { MetadataRoute } from "next";
import { createPublicServerClient } from "@/lib/supabase/server";
import { fetchSections } from "@/lib/api";

const SITE_URL = "https://souq.dasm.com.sa";
// Google hard-limits a single sitemap file to 50,000 URLs. Well beyond
// our current corpus but we cap anyway so we never ship an invalid
// sitemap. If we ever grow past 40k live listings we'll split into
// /sitemap-listings-0.xml + /sitemap-listings-1.xml via
// generateSitemaps().
const LISTING_CAP = 40_000;

export const revalidate = 3600; // 1h — fresh enough for crawl discovery, cheap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/listings`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/publish`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Sections (best-effort)
  let sectionUrls: MetadataRoute.Sitemap = [];
  try {
    const sections = await fetchSections(true);
    sectionUrls = sections
      .filter((s) => s.slug)
      .map((s) => ({
        url: `${SITE_URL}/s/${s.slug}`,
        lastModified: now,
        changeFrequency: "hourly" as const,
        priority: 0.8,
      }));
  } catch {
    sectionUrls = [];
  }

  // Active listings (best-effort)
  let listingUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("marketplace_listings")
      .select("id, updated_at, published_at")
      .eq("status", "active")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(LISTING_CAP);

    listingUrls = (data ?? []).map(
      (row: { id: string; updated_at: string | null; published_at: string | null }) => ({
        url: `${SITE_URL}/listings/${row.id}`,
        lastModified: row.updated_at
          ? new Date(row.updated_at)
          : row.published_at
            ? new Date(row.published_at)
            : now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }),
    );
  } catch {
    listingUrls = [];
  }

  return [...staticPages, ...sectionUrls, ...listingUrls];
}
