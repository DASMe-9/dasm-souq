/**
 * GET /api/v1/listings — paginated public listings
 *
 * Query params:
 *   section, tag, area, q, minPrice, maxPrice, page, perPage, sort
 *
 * Consumed by:
 *   - souq.dasm.com.sa home page + section pages (server-side)
 *   - Future iOS/Android app (mobile)
 *   - Third-party integrations (read-only)
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchListings } from "@/lib/listings";
import type { ListingFilters } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const p = url.searchParams;

  const filters: ListingFilters = {
    section: p.get("section") || undefined,
    tag: p.get("tag") || undefined,
    area: p.get("area") || undefined,
    q: p.get("q") || undefined,
    minPrice: parseNumber(p.get("minPrice")),
    maxPrice: parseNumber(p.get("maxPrice")),
    page: parseNumber(p.get("page")),
    perPage: parseNumber(p.get("perPage")),
    sort: (p.get("sort") as ListingFilters["sort"]) || "latest",
  };

  try {
    const result = await fetchListings(filters);
    return NextResponse.json(
      { status: "success", ...result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}
