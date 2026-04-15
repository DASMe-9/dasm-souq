import axios from "axios";

/**
 * Axios client for DASM Souq → DASM Platform backend.
 * Base URL comes from NEXT_PUBLIC_API_URL (includes /api suffix).
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.dasm.com.sa/api",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;

// ─── Types ─────────────────────────────────────────────

export interface MarketSection {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string | null;
  icon: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  is_pinned: boolean;
  children?: MarketSection[];
}

// ─── Data fetchers ─────────────────────────────────────

/**
 * Fetch active main sections, optionally with active tag children.
 * Server-side friendly (cache: no-store or revalidate as needed).
 */
export async function fetchSections(withChildren = true): Promise<MarketSection[]> {
  const res = await api.get("/marketplace/sections", {
    params: withChildren ? { with_children: 1 } : {},
  });
  return res.data?.data ?? [];
}
