import "server-only";
import { cookies, headers } from "next/headers";

/**
 * Souq → Core subscription/credit fetchers.
 *
 * All endpoints live in Core (api.dasm.com.sa). We carry the dasm_token
 * cookie as a Bearer header — same bridge pattern used by the garage
 * and listings fetchers in this codebase.
 *
 * Shapes mirror the backend response bodies. Keep in sync with
 *   app/Http/Controllers/SubscriptionController.php
 *   app/Http/Controllers/SouqCreditController.php
 *   app/Http/Controllers/PublishGateController.php
 */

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "https://api.dasm.com.sa/api";

// ─── Types ─────────────────────────────────────────────

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  userType: string;
  plan_type: string | null;
  price: number | string;
  durationMonths: number;
  monthlyPrice: number | string;
  durationText: string;
  userTypeText: string;
  planTypeText: string;
  isActive: boolean;
  max_listings: number | null;
  listing_ttl_days: number | null;
  extra_listing_price_sar: number | string | null;
  features: Record<string, unknown> | null;
  orderIndex: number;
}

export interface CurrentSubscription {
  subscription_id: number;
  plan: SubscriptionPlan;
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired" | "failed" | string;
  billing_cycle: "monthly" | "yearly" | "other" | string;
  period_end: string | null;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
  listings_used: number;
  listings_remaining: number | null;
}

export interface CreditTransaction {
  id: number;
  type: "topup" | "spend" | "refund" | string;
  amount_sar: number;
  balance_after_sar: number;
  reason: string | null;
  reference: string | null;
  created_at: string;
}

export interface CreditWallet {
  id: number;
  balance_sar: number;
}

export interface GateDecision {
  allowed: boolean;
  reason?: string;
  plan_type?: string;
  plan_id?: number;
  remaining?: number | null;
  quota_exhausted?: boolean;
  needs_overage_charge?: boolean;
  overage_charge_sar?: number;
  wallet_balance_sar?: number;
  requires_exhibitor_access?: boolean;
  message?: string;
}

// ─── Helpers ───────────────────────────────────────────

async function bearerFromCookie(): Promise<string | null> {
  const store = await cookies();
  const c = store.get("dasm_token");
  return c?.value ? decodeURIComponent(c.value) : null;
}

async function coreHeaders(): Promise<HeadersInit | null> {
  const bearer = await bearerFromCookie();
  if (!bearer) return null;
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return {
    Accept: "application/json",
    Authorization: `Bearer ${bearer}`,
    ...(fwd ? { "X-Forwarded-For": fwd } : {}),
  };
}

// ─── Fetchers ──────────────────────────────────────────

/** Public — no auth required. Used on /pricing. */
export async function fetchPublicPlans(params?: {
  plan_type?: string;
  user_type?: string;
}): Promise<SubscriptionPlan[]> {
  const qs = new URLSearchParams();
  if (params?.plan_type) qs.set("plan_type", params.plan_type);
  if (params?.user_type) qs.set("user_type", params.user_type);
  const url = `${CORE_API_URL}/subscriptions/plans${qs.size ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => null);
    return (body?.data?.plans ?? []) as SubscriptionPlan[];
  } catch {
    return [];
  }
}

/** Auth'd — caller's current subscriptions grouped by plan_type. */
export async function fetchCurrentSubscriptions(): Promise<
  Record<string, CurrentSubscription> | null
> {
  const h = await coreHeaders();
  if (!h) return null;
  try {
    const res = await fetch(`${CORE_API_URL}/me/subscription`, {
      headers: h,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return (body?.data?.subscriptions ?? {}) as Record<string, CurrentSubscription>;
  } catch {
    return null;
  }
}

/** Auth'd — balance + recent ledger for /me/credits. */
export async function fetchCredits(): Promise<{
  wallet: CreditWallet;
  history: CreditTransaction[];
} | null> {
  const h = await coreHeaders();
  if (!h) return null;
  try {
    const res = await fetch(`${CORE_API_URL}/me/credits`, {
      headers: h,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return body?.data ?? null;
  } catch {
    return null;
  }
}

/** Auth'd, idempotent — the dry-run decision used by /publish UI. */
export async function checkPublishGate(): Promise<GateDecision | null> {
  const h = await coreHeaders();
  if (!h) return null;
  try {
    const res = await fetch(`${CORE_API_URL}/me/publish-check`, {
      headers: h,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return (body?.data ?? null) as GateDecision | null;
  } catch {
    return null;
  }
}
