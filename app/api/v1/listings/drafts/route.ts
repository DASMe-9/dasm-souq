/**
 * GET /api/v1/listings/drafts — the authenticated user's drafts.
 *
 * Drafts are marketplace_listings rows with status='draft'. They are not
 * visible in the public feed (the public feed only returns 'active').
 * This endpoint lets the seller resume an ad they started earlier.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { status: "error", message: "يجب تسجيل الدخول أولاً" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("marketplace_listings")
    .select(
      "id, title, section_slug, images, price, updated_at, city, area_code",
    )
    .eq("external_user_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "success", data: data ?? [] });
}
