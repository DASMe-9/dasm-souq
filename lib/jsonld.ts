/**
 * Schema.org JSON-LD builders for listing pages.
 *
 * Google's shopping / vehicle rich results want structured data on
 * every product-ish page. Haraj doesn't emit any — this is one of the
 * cheapest SEO wins souq can stake out.
 *
 * We stay conservative: only fields we actually have in
 * marketplace_listings are emitted. Anything missing (brand, model,
 * mileage, year) comes from vehicle_details if present, else dropped.
 */

import type { MarketplaceListing } from "@/lib/supabase/types";

const CAR_SECTIONS = new Set(["showrooms", "specialized-cars"]);
const SITE_URL = "https://souq.dasm.com.sa";

function vehicleDetails(l: MarketplaceListing): Record<string, unknown> | null {
  // vehicle_details is a JSONB column holding loose key/value pairs
  // (year, make, model, mileage, …). The type layer doesn't model it
  // so we read it defensively.
  const raw = (l as unknown as { vehicle_details?: unknown }).vehicle_details;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;

  const out: Record<string, unknown> = { "@type": "Vehicle" };

  if (typeof v.make === "string" && v.make) out.brand = { "@type": "Brand", name: v.make };
  if (typeof v.model === "string" && v.model) out.model = v.model;
  if (typeof v.year === "number" || (typeof v.year === "string" && v.year)) {
    out.vehicleModelDate = String(v.year);
  }
  if (typeof v.mileage === "number") {
    out.mileageFromOdometer = {
      "@type": "QuantitativeValue",
      value: v.mileage,
      unitCode: "KMT",
    };
  }
  if (typeof v.transmission === "string" && v.transmission) {
    out.vehicleTransmission = v.transmission;
  }
  if (typeof v.fuel_type === "string" && v.fuel_type) {
    out.fuelType = v.fuel_type;
  }
  if (typeof v.body_type === "string" && v.body_type) {
    out.bodyType = v.body_type;
  }

  // Only worth emitting if we got at least one extra field beyond @type.
  return Object.keys(out).length > 1 ? out : null;
}

export function buildListingJsonLd(l: MarketplaceListing): Record<string, unknown> {
  const url = `${SITE_URL}/listings/${l.id}`;
  const isCar = CAR_SECTIONS.has(l.section_slug);
  const vehicle = isCar ? vehicleDetails(l) : null;

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": isCar ? "Vehicle" : "Product",
    "@id": url,
    name: l.title,
    url,
    sku: l.id,
  };

  if (l.description) base.description = l.description;

  if (Array.isArray(l.images) && l.images.length > 0) {
    base.image = l.images.slice(0, 6);
  }

  if (l.price != null && Number.isFinite(Number(l.price))) {
    base.offers = {
      "@type": "Offer",
      url,
      priceCurrency: l.currency || "SAR",
      price: Number(l.price),
      availability:
        l.status === "active"
          ? "https://schema.org/InStock"
          : l.status === "sold"
            ? "https://schema.org/SoldOut"
            : "https://schema.org/Discontinued",
      itemCondition: "https://schema.org/UsedCondition",
      // area/city narrows the geographical relevance — useful for
      // local-intent queries (سيارات للبيع في الرياض).
      ...(l.city ? { areaServed: { "@type": "City", name: l.city } } : {}),
      ...(l.published_at ? { validFrom: l.published_at } : {}),
    };
  }

  // Merge the Vehicle details onto the root if we have them. We keep
  // @type = Vehicle so Google treats it as a vehicle listing, while the
  // offers block drives the price pill in SERPs.
  if (vehicle) {
    for (const [k, v] of Object.entries(vehicle)) {
      if (k === "@type") continue; // root already sets it
      base[k] = v;
    }
  }

  return base;
}
