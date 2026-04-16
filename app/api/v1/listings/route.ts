/**
 * /api/v1/listings
 *
 *   GET  — paginated public listings (filters: section, tag, area, q,
 *          minPrice, maxPrice, page, perPage, sort)
 *   POST — create a new listing (auth required: verified against Core
 *          via Sanctum cookie forwarded to api.dasm.com.sa/api/user)
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchListings } from "@/lib/listings";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import type { ListingFilters } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

// ─── GET ────────────────────────────────────────────────────────

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
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────

interface CreateListingBody {
  title: string;
  section_id: number;
  section_slug: string;
  tag_slug?: string | null;
  description?: string | null;
  price?: number | null;
  is_negotiable?: boolean;
  area_code?: string | null;
  city?: string | null;
  images?: string[];
  external_listable_type?: "Car" | "RealEstate" | "FarmAsset" | null;
  external_listable_id?: number | null;
  is_auctionable?: boolean;
  requires_settlement?: boolean;
  condition?: "new" | "like_new" | "used" | "for_parts" | null;
  vehicle_details?: Record<string, unknown> | null;
  status?: "draft" | "active";
}

const SECTIONS_REQUIRING_SETTLEMENT = new Set(["showrooms", "specialized-cars", "real-estate"]);
const ALLOWED_CONDITIONS = new Set(["new", "like_new", "used", "for_parts"]);
const VEHICLE_SECTIONS = new Set(["showrooms", "specialized-cars"]);

export async function POST(req: NextRequest) {
  // 1. Authenticate via Core
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { status: "error", message: "يجب تسجيل الدخول على dasm.com.sa أولاً" },
      { status: 401 },
    );
  }

  // 2. Parse + validate body
  let body: CreateListingBody;
  try {
    body = (await req.json()) as CreateListingBody;
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const isDraft = body.status === "draft";
  const errors: string[] = [];

  // Drafts are lenient — only section is required (so we can key "my drafts"
  // by section and come back to it). Title/price/images are optional for
  // drafts but enforced on publish.
  if (!body.section_id || !body.section_slug) errors.push("اختر القسم");
  if (!isDraft && !body.title?.trim()) errors.push("العنوان مطلوب");
  if (body.title && body.title.length > 200) errors.push("العنوان طويل جداً (حد أقصى 200 حرف)");
  if (body.description && body.description.length > 5000)
    errors.push("الوصف طويل جداً (حد أقصى 5000 حرف)");
  if (body.price != null && (!Number.isFinite(body.price) || body.price < 0))
    errors.push("السعر غير صالح");
  if (body.images && !Array.isArray(body.images))
    errors.push("صيغة الصور غير صحيحة");
  if (body.images && body.images.length > 20)
    errors.push("لا يمكن رفع أكثر من 20 صورة");
  if (body.condition != null && !ALLOWED_CONDITIONS.has(body.condition))
    errors.push("حالة المنتج غير صالحة");
  if (
    body.vehicle_details != null &&
    (typeof body.vehicle_details !== "object" || Array.isArray(body.vehicle_details))
  )
    errors.push("تفاصيل المركبة غير صالحة");

  if (errors.length > 0) {
    return NextResponse.json(
      { status: "error", message: errors.join(". "), errors },
      { status: 422 },
    );
  }

  // 3. Auto-set requires_settlement for big-ticket sections
  const requiresSettlement =
    typeof body.requires_settlement === "boolean"
      ? body.requires_settlement
      : SECTIONS_REQUIRING_SETTLEMENT.has(body.section_slug);

  // 4. Insert
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("marketplace_listings")
      .insert({
        external_user_id: user.id,
        section_id: body.section_id,
        section_slug: body.section_slug,
        tag_slug: body.tag_slug ?? null,
        title: (body.title ?? "").trim() || (isDraft ? "(مسوّدة بدون عنوان)" : ""),
        description: body.description?.trim() ?? null,
        images: body.images ?? [],
        price: body.price ?? null,
        is_negotiable: body.is_negotiable ?? true,
        currency: "SAR",
        area_code: body.area_code ?? null,
        city: body.city ?? null,
        status: isDraft ? "draft" : "active",
        is_auctionable: body.is_auctionable ?? false,
        requires_settlement: requiresSettlement,
        external_listable_type: body.external_listable_type ?? null,
        external_listable_id: body.external_listable_id ?? null,
        condition: body.condition ?? null,
        // Only persist vehicle_details for sections where it makes sense.
        // Other sections get {} so we never store unrelated JSON.
        vehicle_details:
          body.vehicle_details && VEHICLE_SECTIONS.has(body.section_slug)
            ? body.vehicle_details
            : {},
        published_at: isDraft ? null : new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "success", data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
