import "server-only";
import { headers, cookies } from "next/headers";

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "https://api.dasm.com.sa/api";

export interface GarageDestinationSouq {
  active: boolean;
  listing_id?: string | null;
  status?: string | null;
  views?: number;
  favorites?: number;
  published_at?: string | null;
}

export interface GarageDestinationAuction {
  active: boolean;
  auction_id?: number;
  status?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  min_price?: number | null;
  max_price?: number | null;
}

export interface GarageCar {
  id: number;
  title: string;
  make: string | null;
  model: string | null;
  year: string | number | null;
  image_url: string | null;
  price: number | null;
  city: string | null;
  odometer: string | number | null;
  created_at: string | null;
  updated_at: string | null;
  destinations: {
    souq_listing: GarageDestinationSouq;
    auction: GarageDestinationAuction;
  };
  is_idle: boolean;
}

export interface GarageSummary {
  total_cars: number;
  in_souq: number;
  in_auction: number;
  idle: number;
}

export interface GarageData {
  cars: GarageCar[];
  summary: GarageSummary;
}

/**
 * Fetch the authenticated user's garage from Core via /api/me/garage.
 * Server-side only — uses the same Bearer-token bridge as
 * lib/auth.ts (dasm_token cookie, no Cookie passthrough).
 */
export async function fetchUserGarage(): Promise<GarageData | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("dasm_token");
    const bearer = tokenCookie?.value
      ? decodeURIComponent(tokenCookie.value)
      : null;
    if (!bearer) return null;

    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");

    const res = await fetch(`${CORE_API_URL}/me/garage`, {
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
    return (body.data ?? null) as GarageData | null;
  } catch {
    return null;
  }
}
