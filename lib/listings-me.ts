import "server-only";
import { headers, cookies } from "next/headers";

/**
 * Fetcher for /api/me/listings (Core).
 *
 * The server we hit is Core (api.dasm.com.sa) but the data lives in
 * DASM-services — Core's MeListingsController proxies the read via
 * SouqMirrorService. From the souq /me perspective this is just one
 * more GET with the same Bearer-token bridge that /api/me/garage uses.
 *
 * Purpose: surface the seller's NON-car inventory in "مساحتي". Cars
 * continue to come from fetchUserGarage() in lib/garage.ts.
 */

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "https://api.dasm.com.sa/api";

export type ListingStatus =
  | "pending"
  | "active"
  | "paused"
  | "sold"
  | "expired";

export interface MeListing {
  id: string;
  title: string;
  section_slug: string;
  status: ListingStatus | string;
  price: number | null;
  city: string | null;
  images: string[];
  views_count: number;
  favorites_count: number;
  published_at: string | null;
  updated_at: string | null;
  is_auctionable: boolean;
}

export interface MeListingsSummary {
  total: number;
  active: number;
  paused: number;
  sold: number;
  expired: number;
  pending: number;
}

export interface MeListingsData {
  listings: MeListing[];
  summary: MeListingsSummary;
}

export async function fetchUserListings(): Promise<MeListingsData | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("dasm_token");
    const bearer = tokenCookie?.value
      ? decodeURIComponent(tokenCookie.value)
      : null;
    if (!bearer) return null;

    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");

    const res = await fetch(`${CORE_API_URL}/me/listings`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearer}`,
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    if (!body || body.success === false) return null;
    return (body.data ?? null) as MeListingsData | null;
  } catch {
    return null;
  }
}
