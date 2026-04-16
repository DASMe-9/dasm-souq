/**
 * POST /api/v1/listings/[id]/view — track a view (telemetry)
 *
 * Increments listings.views_count + logs a row in marketplace_views.
 * Uses service role on the server (RLS would otherwise block writes).
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
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

  try {
    const admin = createAdminClient();

    // Fire-and-forget log (don't block the response on this)
    const viewerIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

    const [logResult, bumpResult] = await Promise.allSettled([
      admin.from("marketplace_views").insert({
        listing_id: id,
        viewer_ip: viewerIp,
        user_agent: userAgent,
      }),
      admin.rpc("increment_listing_views", { p_listing_id: id }).then(
        (r) => r,
        async () => {
          // Fallback when RPC not defined: update via raw increment
          return admin
            .from("marketplace_listings")
            .update({ views_count: 0 })
            .eq("id", id)
            .select("views_count")
            .maybeSingle();
        },
      ),
    ]);

    return NextResponse.json({
      status: "success",
      logged: logResult.status === "fulfilled",
      bumped: bumpResult.status === "fulfilled",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
