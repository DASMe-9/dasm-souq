/**
 * GET /api/v1/listings/[id] — single active listing.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchListingById } from "@/lib/listings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
