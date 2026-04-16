/**
 * /api/v1/listings/[id]
 *
 *   GET    — single active listing (public).
 *   PATCH  — update a listing (auth required + ownership check).
 *            Supports promoting a draft → active via `status: "active"`.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchListingById } from "@/lib/listings";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_CONDITIONS = new Set(["new", "like_new", "used", "for_parts"]);
const VEHICLE_SECTIONS = new Set(["showrooms", "specialized-cars"]);
const ALLOWED_STATUSES = new Set([
  "draft",
  "active",
  "paused",
  "sold",
  "deleted",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { status: "error", message: "Missing id" },
      { status: 400 },
    );
  }

  try {
    const listing = await fetchListingById(id);
    if (!listing) {
      return NextResponse.json(
        { status: "error", message: "Listing not found or inactive" },
        { status: 404 },
      );
    }
    return NextResponse.json({ status: "success", data: listing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

// ─── PATCH ──────────────────────────────────────────────────────

interface PatchListingBody {
  title?: string | null;
  description?: string | null;
  price?: number | null;
  is_negotiable?: boolean;
  area_code?: string | null;
  city?: string | null;
  images?: string[];
  condition?: "new" | "like_new" | "used" | "for_parts" | null;
  vehicle_details?: Record<string, unknown> | null;
  is_auctionable?: boolean;
  status?: "draft" | "active" | "paused" | "sold" | "deleted";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { status: "error", message: "Missing id" },
      { status: 400 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { status: "error", message: "يجب تسجيل الدخول أولاً" },
      { status: 401 },
    );
  }

  let body: PatchListingBody;
  try {
    body = (await req.json()) as PatchListingBody;
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Ownership check — can't touch someone else's listing.
  const { data: existing, error: loadError } = await admin
    .from("marketplace_listings")
    .select("id, external_user_id, section_slug, status, published_at")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json(
      { status: "error", message: loadError.message },
      { status: 500 },
    );
  }
  if (!existing) {
    return NextResponse.json(
      { status: "error", message: "الإعلان غير موجود" },
      { status: 404 },
    );
  }
  if (existing.external_user_id !== user.id) {
    return NextResponse.json(
      { status: "error", message: "غير مسموح بتعديل إعلان مستخدم آخر" },
      { status: 403 },
    );
  }

  const errors: string[] = [];
  if (body.title != null && body.title.length > 200)
    errors.push("العنوان طويل جداً (حد أقصى 200 حرف)");
  if (body.description != null && body.description.length > 5000)
    errors.push("الوصف طويل جداً (حد أقصى 5000 حرف)");
  if (body.price != null && (!Number.isFinite(body.price) || body.price < 0))
    errors.push("السعر غير صالح");
  if (body.images != null && (!Array.isArray(body.images) || body.images.length > 20))
    errors.push("صيغة أو عدد الصور غير صحيح");
  if (body.condition != null && !ALLOWED_CONDITIONS.has(body.condition))
    errors.push("حالة المنتج غير صالحة");
  if (body.status != null && !ALLOWED_STATUSES.has(body.status))
    errors.push("الحالة غير صالحة");
  if (
    body.vehicle_details != null &&
    (typeof body.vehicle_details !== "object" || Array.isArray(body.vehicle_details))
  )
    errors.push("تفاصيل المركبة غير صالحة");

  // If promoting a draft → active, require title + section + at least one image.
  if (body.status === "active" && existing.status === "draft") {
    const effectiveTitle = (body.title ?? "").trim();
    if (!effectiveTitle || effectiveTitle === "(مسوّدة بدون عنوان)")
      errors.push("أضف عنواناً للإعلان قبل النشر");
    if (body.images && body.images.length === 0)
      errors.push("أضف صورة واحدة على الأقل قبل النشر");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { status: "error", message: errors.join(". "), errors },
      { status: 422 },
    );
  }

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title?.trim() ?? null;
  if (body.description !== undefined) patch.description = body.description?.trim() ?? null;
  if (body.price !== undefined) patch.price = body.price;
  if (body.is_negotiable !== undefined) patch.is_negotiable = body.is_negotiable;
  if (body.area_code !== undefined) patch.area_code = body.area_code;
  if (body.city !== undefined) patch.city = body.city;
  if (body.images !== undefined) patch.images = body.images;
  if (body.condition !== undefined) patch.condition = body.condition;
  if (body.is_auctionable !== undefined) patch.is_auctionable = body.is_auctionable;
  if (body.vehicle_details !== undefined) {
    patch.vehicle_details =
      body.vehicle_details && VEHICLE_SECTIONS.has(existing.section_slug)
        ? body.vehicle_details
        : {};
  }

  if (body.status !== undefined) {
    patch.status = body.status;
    if (body.status === "active" && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { status: "error", message: "لم يتم إرسال أي حقل للتعديل" },
      { status: 422 },
    );
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from("marketplace_listings")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "success", data });
}
