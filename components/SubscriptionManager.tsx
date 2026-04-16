"use client";

import { useState } from "react";
import { Loader2, Check, X, RefreshCw } from "lucide-react";
import type {
  CurrentSubscription,
  SubscriptionPlan,
} from "@/lib/subscriptions";

/**
 * Client island embedded by /me/subscription.
 *
 * Talks directly to Core with the same dasm_token bearer pattern the
 * rest of souq uses. POSTs to:
 *   /api/subscriptions/subscribe   (upgrade/downgrade)
 *   /api/subscriptions/cancel      (schedule end-of-period cancel)
 *   /api/subscriptions/reactivate  (undo scheduled cancel)
 */

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "https://api.dasm.com.sa/api";

interface Props {
  plans: SubscriptionPlan[];
  currentByType: Record<string, CurrentSubscription>;
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const t = localStorage.getItem("dasm_token");
    if (t) return t;
  } catch {
    /* ignore */
  }
  try {
    const m = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("dasm_token="));
    if (m) return decodeURIComponent(m.slice("dasm_token=".length));
  } catch {
    /* ignore */
  }
  return null;
}

async function corePost<T = unknown>(path: string, body: unknown): Promise<T> {
  const token = readToken();
  if (!token) throw new Error("جلستك انتهت — أعد تسجيل الدخول");
  const res = await fetch(`${CORE_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as any)?.success === false) {
    throw new Error((data as any)?.message || `HTTP ${res.status}`);
  }
  return data as T;
}

export default function SubscriptionManager({ plans, currentByType }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Group plans by type for tidy display.
  const grouped = plans.reduce<Record<string, SubscriptionPlan[]>>((acc, p) => {
    const k = p.plan_type || "other";
    (acc[k] ||= []).push(p);
    return acc;
  }, {});

  async function subscribe(plan: SubscriptionPlan) {
    setBusyId(plan.id);
    setError(null);
    setNotice(null);
    try {
      await corePost("/subscriptions/subscribe", { plan_id: plan.id });
      setNotice(`تم الاشتراك في خطة "${plan.name}" بنجاح.`);
      // Reload the page to reflect new state server-side.
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      setError(e?.message || "تعذّر الاشتراك. حاول لاحقاً.");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(sub: CurrentSubscription) {
    if (!confirm("هل تريد إلغاء الاشتراك في نهاية الفترة الحالية؟")) return;
    setBusyId(sub.plan.id);
    setError(null);
    setNotice(null);
    try {
      await corePost("/subscriptions/cancel", {
        subscription_id: sub.subscription_id,
      });
      setNotice("تم جدولة الإلغاء في نهاية الفترة الحالية.");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      setError(e?.message || "تعذّر الإلغاء.");
    } finally {
      setBusyId(null);
    }
  }

  async function reactivate(sub: CurrentSubscription) {
    setBusyId(sub.plan.id);
    setError(null);
    setNotice(null);
    try {
      await corePost("/subscriptions/reactivate", {
        subscription_id: sub.subscription_id,
      });
      setNotice("تم إلغاء طلب الإلغاء — سيستمر اشتراكك عادياً.");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      setError(e?.message || "تعذّر إلغاء الإلغاء.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {Object.entries(grouped).map(([planType, list]) => {
        const current = currentByType[planType];
        return (
          <div
            key={planType}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
          >
            <div className="px-4 py-2 text-xs font-bold bg-[var(--bg-muted)] text-[var(--fg-muted)]">
              {list[0]?.planTypeText || planType}
            </div>
            <ul className="divide-y divide-[var(--border-soft)]">
              {list
                .filter((p) => p.isActive)
                .map((p) => {
                  const isCurrent = current?.plan.id === p.id;
                  const busy = busyId === p.id;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between p-4 gap-3 flex-wrap"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                          {p.name}
                          {isCurrent && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                              <Check className="w-2.5 h-2.5" />
                              الخطة الحالية
                            </span>
                          )}
                          {isCurrent && current?.cancel_at_period_end && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              بانتظار الإلغاء
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                          {Number(p.price).toLocaleString("ar-SA")} ر.س
                          {p.durationMonths === 12
                            ? " / سنة"
                            : p.durationMonths === 1
                              ? " / شهر"
                              : ` / ${p.durationMonths} شهر`}
                          {p.max_listings != null &&
                            ` · ${p.max_listings} إعلان`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          current?.cancel_at_period_end ? (
                            <button
                              type="button"
                              onClick={() => reactivate(current)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-xs font-bold disabled:opacity-60"
                            >
                              {busy ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              استمرار
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => cancel(current!)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-[var(--border)] text-[var(--fg)] text-xs font-bold hover:bg-[var(--bg-muted)] disabled:opacity-60"
                            >
                              {busy ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : null}
                              إلغاء
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => subscribe(p)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-xs font-bold disabled:opacity-60"
                          >
                            {busy && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {current ? "تبديل" : "اشترك"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
