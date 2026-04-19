import { notFound, redirect } from "next/navigation";
import { fetchListingByCarId } from "@/lib/listings";

export const dynamic = "force-dynamic";

/**
 * /cars/{id} — cross-product entry point from stream and other surfaces.
 *
 * Resolves a Core car id to the most-recent active souq listing for
 * that car, then 308-redirects to /listings/{listing_id}.
 *
 * Why a redirect (not just rendering the listing here):
 *   The listing detail page already does a lot — hydrates the user,
 *   inspection sidecar, jsonld, talk widget, owner-aware controls.
 *   Duplicating that surface for the car-id path would drift; the
 *   redirect keeps a single source of truth for /listings/[id].
 *
 * If no active listing exists for the car (sold / withdrawn / never
 * listed on souq), surfaces 404 — better than redirecting to a
 * dead /listings/{id}.
 */
export default async function CarRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carId = Number(id);
  if (!Number.isFinite(carId) || carId <= 0) notFound();

  const listing = await fetchListingByCarId(carId);
  if (!listing) notFound();

  redirect(`/listings/${listing.id}`);
}
