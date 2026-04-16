/**
 * Authentication bridge — DASM Souq trusts DASM Platform (Core) as the
 * identity authority. A user logged into dasm.com.sa has a Sanctum cookie
 * on the .dasm.com.sa apex domain, so it's automatically sent to
 * souq.dasm.com.sa requests.
 *
 * To verify who the user is, we forward the cookie to Core's /api/user
 * endpoint. If Core answers 200 with a user object, the request is
 * authenticated as that user.
 */
import "server-only";
import { headers, cookies } from "next/headers";

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "https://api.dasm.com.sa/api";

export interface CoreUser {
  id: number;
  name?: string;
  email?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Returns the authenticated Core user or null if not logged in.
 * Cached per-request via React's cache() in the caller if needed.
 */
export async function getAuthenticatedUser(): Promise<CoreUser | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("dasm_token");
    const bearer = tokenCookie?.value
      ? decodeURIComponent(tokenCookie.value)
      : null;

    // Bearer is the only path we trust on the server. Forwarding the full
    // browser cookie jar (laravel_session, XSRF-TOKEN, refresh_token, …)
    // makes Sanctum classify the request as stateful when souq.dasm.com.sa
    // is in SANCTUM_STATEFUL_DOMAINS and then reject it for missing the
    // matching X-XSRF-TOKEN header — which surfaced today as a silent
    // redirect loop on /publish even though the same Bearer worked from
    // the browser. Token-only is also a smaller wire payload + simpler
    // cache invariants on Vercel.
    if (!bearer) return null;

    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");

    const res = await fetch(`${CORE_API_URL}/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearer}`,
        // Origin intentionally omitted: with no Origin and no cookies,
        // Sanctum must use the token guard, not the SPA stateful guard.
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as
      | CoreUser
      | { data?: CoreUser }
      | null;
    if (!body) return null;
    // /api/user wraps the user in `{ success: true, data: {...} }` —
    // unwrap if needed so callers don't have to know.
    const user = ("id" in (body as object) ? body : (body as { data?: CoreUser }).data) as
      | CoreUser
      | undefined;
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

/**
 * Convenience: fetch the active marketplace sections from Core so the
 * publish form can populate its section picker from the source of truth.
 */
export async function fetchCoreSections(): Promise<
  Array<{ id: number; slug: string; name_ar: string; icon: string | null }>
> {
  try {
    const res = await fetch(`${CORE_API_URL}/marketplace/sections`, {
      headers: { Accept: "application/json", Origin: "https://souq.dasm.com.sa" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body?.data) ? body.data : [];
  } catch {
    return [];
  }
}

export async function fetchCoreRegions(): Promise<
  Array<{ id: number; code: string; name: string }>
> {
  try {
    const res = await fetch(`${CORE_API_URL}/regions`, {
      headers: { Accept: "application/json", Origin: "https://souq.dasm.com.sa" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body?.data) ? body.data : [];
  } catch {
    return [];
  }
}
