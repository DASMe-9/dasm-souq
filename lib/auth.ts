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
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    if (!cookieHeader) return null;

    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");

    const res = await fetch(`${CORE_API_URL}/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
        Origin: "https://souq.dasm.com.sa",
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as CoreUser;
    return data?.id ? data : null;
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
