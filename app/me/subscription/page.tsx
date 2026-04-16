import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  fetchCurrentSubscriptions,
  fetchCredits,
  fetchPublicPlans,
  type CurrentSubscription,
} from "@/lib/subscriptions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SubscriptionManager from "@/components/SubscriptionManager";
import {
  CreditCard,
  Clock,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "اشتراكاتي — سوق داسم",
};
export const dynamic = "force-dynamic";

/**
 * /me/subscription — authenticated. Shows:
 *   • Current subscriptions grouped by plan_type (souq_listing,
 *     exhibitor_access, auction_*, ...)
 *   • Credit wallet balance + topup CTA
 *   • Recent transactions
 *   • The list of available plans in case the user wants to upgrade
 *
 * Subscribe / cancel / reactivate buttons hit Core via the
 * SubscriptionManager client component.
 */
export default async function MySubscriptionPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/auth/login?returnUrl=/me/subscription");

  const [subs, credits, plans] = await Promise.all([
    fetchCurrentSubscriptions(),
    fetchCredits(),
    fetchPublicPlans(),
  ]);

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
            اشتراكاتي
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">
            إدارة خططك، رصيد محفظة الاعتماد، وسجل المعاملات الأخيرة.
          </p>
        </div>

        {/* Current subscriptions */}
        <section className="space-y-3">
          <SectionTitle icon={<ShoppingBag className="w-4 h-4" />}>
            اشتراكاتي النشطة
          </SectionTitle>

          {!subs || Object.keys(subs).length === 0 ? (
            <EmptySubscriptions />
          ) : (
            <div className="space-y-3">
              {Object.entries(subs).map(([planType, sub]) => (
                <SubscriptionRow key={planType} sub={sub} />
              ))}
            </div>
          )}
        </section>

        {/* Credit wallet */}
        <section className="space-y-3">
          <SectionTitle icon={<CreditCard className="w-4 h-4" />}>
            محفظة الاعتماد
          </SectionTitle>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-[var(--fg-muted)] mb-0.5">الرصيد الحالي</div>
              <div className="text-3xl font-extrabold text-[var(--brand-700)] tabular-nums">
                {credits?.wallet.balance_sar != null
                  ? `${Number(credits.wallet.balance_sar).toLocaleString("ar-SA")} ر.س`
                  : "0 ر.س"}
              </div>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                يُستخدم للإعلانات الإضافية فوق سقف الخطة، والتثبيت، والظهور في
                الرئيسية.
              </p>
            </div>
            <a
              href="/me/credits"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-bold"
            >
              شحن + سجل كامل
            </a>
          </div>

          {credits?.history && credits.history.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
              <div className="px-4 py-2 text-[11px] font-bold text-[var(--fg-muted)] bg-[var(--bg-muted)]">
                آخر المعاملات
              </div>
              <ul className="divide-y divide-[var(--border-soft)] max-h-72 overflow-y-auto">
                {credits.history.slice(0, 10).map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-4 py-2 text-xs">
                    <div>
                      <div className="font-semibold">
                        {t.reason || t.type}
                      </div>
                      <div className="text-[10px] text-[var(--fg-muted)]">
                        {new Date(t.created_at).toLocaleString("ar-SA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        t.type === "spend"
                          ? "text-red-500"
                          : t.type === "refund"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {t.type === "spend" ? "−" : "+"}
                      {Number(t.amount_sar).toLocaleString("ar-SA")} ر.س
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Manage / upgrade */}
        <section className="space-y-3">
          <SectionTitle icon={<CheckCircle2 className="w-4 h-4" />}>
            إدارة الاشتراك
          </SectionTitle>
          <SubscriptionManager
            plans={plans}
            currentByType={subs ?? {}}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
      {icon && (
        <span className="inline-flex w-7 h-7 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] items-center justify-center">
          {icon}
        </span>
      )}
      {children}
    </h2>
  );
}

function SubscriptionRow({ sub }: { sub: CurrentSubscription }) {
  const statusStyle: Record<string, string> = {
    trialing: "bg-blue-100 text-blue-700",
    active: "bg-emerald-100 text-emerald-700",
    past_due: "bg-amber-100 text-amber-700",
    cancelled: "bg-stone-100 text-stone-600",
  };
  const statusText: Record<string, string> = {
    trialing: "في فترة تجريبية",
    active: "نشط",
    past_due: "متأخر",
    cancelled: "ملغى",
  };
  const periodEnd = sub.period_end
    ? new Date(sub.period_end).toLocaleDateString("ar-SA", { dateStyle: "medium" })
    : "—";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div>
          <div className="font-extrabold text-base">{sub.plan.name}</div>
          <div className="text-xs text-[var(--fg-muted)] mt-0.5">
            {sub.plan.planTypeText}
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            statusStyle[sub.status] ?? "bg-stone-100 text-stone-600"
          }`}
        >
          {statusText[sub.status] ?? sub.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-3">
        <div>
          <div className="text-[10px] text-[var(--fg-muted)]">ينتهي في</div>
          <div className="font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {periodEnd}
          </div>
        </div>
        {sub.listings_remaining != null && (
          <div>
            <div className="text-[10px] text-[var(--fg-muted)]">
              إعلانات متبقية
            </div>
            <div className="font-bold tabular-nums">
              {sub.listings_remaining} / {sub.plan.max_listings ?? "—"}
            </div>
          </div>
        )}
        <div>
          <div className="text-[10px] text-[var(--fg-muted)]">الفوترة</div>
          <div className="font-bold">
            {sub.billing_cycle === "yearly" ? "سنوي" : "شهري"}
          </div>
        </div>
      </div>

      {sub.cancel_at_period_end && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            تم جدولة إلغاء هذا الاشتراك عند نهاية الفترة. يمكنك إلغاء الإلغاء
            من قسم الإدارة أدناه.
          </span>
        </div>
      )}
    </div>
  );
}

function EmptySubscriptions() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
      <p className="text-sm text-[var(--fg-muted)] mb-3">
        لا يوجد اشتراك نشط. اختر خطة من صفحة الأسعار لبدء النشر.
      </p>
      <a
        href="/pricing"
        className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-bold"
      >
        استعرض الخطط
      </a>
    </div>
  );
}
