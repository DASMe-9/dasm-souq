/**
 * Listing data-access layer — server-side only.
 * Wraps Supabase queries with typed responses + filtering logic.
 */
import { createPublicServerClient } from "@/lib/supabase/server";
import type {
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
