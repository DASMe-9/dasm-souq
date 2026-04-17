/**
 * Listing data-access layer — server-side only.
 * Wraps Supabase queries with typed responses + filtering logic.
 */
import { createAdminClient, createPublicServerClient } from "@/lib/supabase/server";
import type {
  InspectionSummary,
  ListingFilters,
  ListingsPage,
  MarketplaceListing,
} from "@/lib/supabase/types";

const DEFAULT_PAGE_SIZE = 24;

export async function fetchListings(
  filters: ListingFilters = {},
): Promise<ListingsPage> {
  const supabase = createPublicServerClient();

  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let q = supabase
    .from("marketplace_listings")
    .select("*", { count: "exact" })
    .eq("status", "active");

  if (filters.section) q = q.eq("section_slug", filters.section);
  if (filters.tag) q = q.eq("tag_slug", filters.tag);
  if (filters.area) q = q.eq("area_code", filters.area);
  if (filters.q) q = q.ilike("title", `%${filters.q}%`);
  if (typeof filters.minPrice === "number") q = q.gte("price", filters.minPrice);
  if (typeof filters.maxPrice === "number") q = q.lte("price", filters.maxPrice);

  switch (filters.sort) {
    case "price_asc":
      q = q.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false, nullsFirst: false });
      break;
    case "popular":
      q = q.order("views_count", { ascending: false });
      break;
    case "latest":
    default:
      q = q.order("published_at", { ascending: false, nullsFirst: false });
      break;
  }

  q = q.range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  const items = (data ?? []) as MarketplaceListing[];
  const total = count ?? items.length;
  return { items, total, page, perPage, hasMore: from + items.length < total };
}

export async function fetchListingById(
  id: string,
): Promise<MarketplaceListing | null> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return (data as MarketplaceListing) ?? null;
}

export async function fetchFeaturedListings(
  limit = 8,
): Promise<MarketplaceListing[]> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("v_active_featured_listings")
    .select("*")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MarketplaceListing[];
}

/**
 * Fetch the most-recent inspection summary for a batch of listing ids.
 * Returns a map keyed by listing_id — listings without any report are
 * simply absent from the map.
 *
 * Uses the admin (service-role) client because inspection_reports is
 * marked service-only in the schema migration. The caller is trusted
 * (server component / route handler) and only a narrow whitelist of
 * public fields is projected — nothing sensitive is exposed.
 */
export async function fetchInspectionsForListings(
  listingIds: string[],
): Promise<Record<string, InspectionSummary>> {
  if (listingIds.length === 0) return {};
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_inspection_reports")
    .select("listing_id, rating, inspector_name, inspected_at, report_url")
    .in("listing_id", listingIds)
    .order("inspected_at", { ascending: false, nullsFirst: false });
  if (error) throw error;

  const map: Record<string, InspectionSummary> = {};
  for (const row of (data ?? []) as Array<{
    listing_id: string;
    rating: number | null;
    inspector_name: string | null;
    inspected_at: string | null;
    report_url: string | null;
  }>) {
    // First row per listing_id wins — ordered newest-first above.
    if (!map[row.listing_id]) {
      map[row.listing_id] = {
        rating: row.rating,
        inspector_name: row.inspector_name,
        inspected_at: row.inspected_at,
        report_url: row.report_url,
      };
    }
  }
  return map;
}

/** Single-listing variant — a thin convenience wrapper for detail pages. */
export async function fetchInspectionForListing(
  listingId: string,
): Promise<InspectionSummary | null> {
  const map = await fetchInspectionsForListings([listingId]);
  return map[listingId] ?? null;
}
