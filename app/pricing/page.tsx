import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  fetchPublicPlans,
  fetchCurrentSubscriptions,
  type SubscriptionPlan,
} from "@/lib/subscriptions";
import {
  Check,
  Crown,
  ShoppingBag,
  Building2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "الأسعار — سوق داسم",
  description:
    "خطط الاشتراك في سوق داسم: مجاني للأفراد، خطة نشطة، خطة تاجر/معرض، وخطة وصول المعرض. بدون عمولات على البيع من الإعلانات المبوّبة.",
};

export const dynamic = "force-dynamic";

/**
 * /pricing — public page. Shows all active subscription plans grouped
 * by plan_type so the visitor can compare and pick. Highlights the
 * "currently on" badge if they're signed in.
 */
export default async function PricingPage() {
  const [plans, current] = await Promise.all([
    fetchPublicPlans(),
    fetchCurrentSubscriptions(),
  ]);

  // Group by plan_type for clean section rendering.
  const byType = plans.reduce<Record<string, SubscriptionPlan[]>>((acc, p) => {
    const k = p.plan_type || "other";
    (acc[k] ||= []).push(p);
    return acc;
  }, {});

  const currentIds = new Set<number>();
  if (current) {
    for (const v of Object.values(current)) {
      currentIds.add(v.plan.id);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12" dir="rtl">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
            الأسعار في سوق داسم
          </h1>
          <p className="text-sm sm:text-base text-[var(--fg-muted)] max-w-2xl mx-auto">
            بدون عمولات على البيع من الإعلانات المبوّبة — اختر خطة تناسبك وانشر
            إعلاناتك. المزادات لها جدول عمولات منفصل عند البيع.
          </p>
        </div>

        {plans.length === 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center text-amber-900">
            لا توجد خطط مفعّلة حالياً. سيتم تفعيل الخطط قريباً.
          </div>
        )}

        {/* Souq listings */}
        {byType["souq_listing"] && byType["souq_listing"].length > 0 && (
          <PlansSection
            title="خطط نشر الإعلانات"
            subtitle="لنشر العقار، الأجهزة، الأثاث، المواشي، السلع المتنوّعة. يغطي أيضاً السيارات إذا اخترت نشرها كإعلان مبوّب."
            icon={<ShoppingBag className="w-5 h-5" />}
            plans={byType["souq_listing"]}
            currentIds={currentIds}
          />
        )}

        {/* Exhibitor access — highlighted as it's mandatory */}
        {byType["exhibitor_access"] && byType["exhibitor_access"].length > 0 && (
          <PlansSection
            title="وصول المعرض (إلزامي لأصحاب المعارض)"
            subtitle="اشتراك ثابت لتشغيل المعرض — يُضاف على عمولة المبيعات من المزادات، وليس بديلاً عنها."
            icon={<Building2 className="w-5 h-5" />}
            plans={byType["exhibitor_access"]}
            currentIds={currentIds}
            accent="amber"
          />
        )}

        {/* Auction plans (bidder/dealer) */}
        {(byType["auction_bidder"] || byType["auction_dealer"]) && (
          <PlansSection
            title="خطط المزادات"
            subtitle="اشتراكات المشاركة في سوق المزادات (مزايدين وتجار). العمولة على البيعات تُحتسب بجدول العمولات وليست جزءاً من الاشتراك."
            icon={<Crown className="w-5 h-5" />}
            plans={[
              ...(byType["auction_bidder"] ?? []),
              ...(byType["auction_dealer"] ?? []),
            ]}
            currentIds={currentIds}
          />
        )}

        {/* Side note on auction commissions */}
        <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-sm text-[var(--fg-muted)] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-[var(--brand-700)]" />
          <div className="space-y-1">
            <p>
              <b>السيارات في المزاد:</b> العمولة عند البيع محسوبة حسب جدول
              العمولات المعلن في لوحة الأدمن. الأوكشنير يستحق مبلغاً ثابتاً
              لكل بيعة ناجحة ضمن الفئة.
            </p>
            <p>
              <b>إعلان إضافي فوق السقف:</b> يُخصم من رصيدك في محفظة الاعتماد
              حسب السعر المعلن في خطتك (افتراضي 10 ر.س).
            </p>
            <p>
              <b>ترقيات الظهور:</b> تثبيت وإبراز الإعلان على الصفحة الرئيسية
              — تُخصم أيضاً من رصيدك.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PlansSection({
  title,
  subtitle,
  icon,
  plans,
  currentIds,
  accent,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  plans: SubscriptionPlan[];
  currentIds: Set<number>;
  accent?: "amber";
}) {
  return (
    <section className="mb-10">
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
              accent === "amber"
                ? "bg-amber-100 text-amber-700"
                : "bg-[var(--brand-50)] text-[var(--brand-700)]"
            }`}
          >
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--fg-muted)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} isCurrent={currentIds.has(p.id)} />
        ))}
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  isCurrent,
}: {
  plan: SubscriptionPlan;
  isCurrent: boolean;
}) {
  const price = Number(plan.price);
  const priceLabel =
    price === 0 ? "مجاني" : `${price.toLocaleString("ar-SA")} ر.س`;
  const perLabel =
    plan.durationMonths === 1
      ? "/ شهر"
      : plan.durationMonths === 12
        ? "/ سنة"
        : ` / ${plan.durationMonths} شهر`;

  return (
    <article
      className={`relative rounded-2xl border bg-[var(--bg-card)] p-5 flex flex-col ${
        isCurrent
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : "border-[var(--border)]"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-2 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
          <Sparkles className="w-2.5 h-2.5" />
          خطتك الحالية
        </span>
      )}

      <h3 className="text-base font-extrabold mb-1">{plan.name}</h3>
      <p className="text-xs text-[var(--fg-muted)] mb-3 min-h-[2.5rem] leading-snug">
        {plan.description}
      </p>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-extrabold text-[var(--brand-700)]">
          {priceLabel}
        </span>
        {price > 0 && (
          <span className="text-xs text-[var(--fg-muted)]">{perLabel}</span>
        )}
      </div>

      <ul className="space-y-2 text-xs sm:text-sm mb-4 flex-1">
        {plan.max_listings != null && (
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            حتى {plan.max_listings.toLocaleString("ar-SA")} إعلان في الفترة
          </li>
        )}
        {plan.listing_ttl_days && (
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            صلاحية كل إعلان: {plan.listing_ttl_days} يوم
          </li>
        )}
        {plan.extra_listing_price_sar != null &&
          Number(plan.extra_listing_price_sar) > 0 && (
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              إعلان إضافي {Number(plan.extra_listing_price_sar)} ر.س
              (يُخصم من الرصيد)
            </li>
          )}
        {plan.features &&
          Object.entries(plan.features).map(([k, v]) => {
            if (v === false || v === null || v === undefined) return null;
            return (
              <li key={k} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                {featureLabel(k, v)}
              </li>
            );
          })}
      </ul>

      {isCurrent ? (
        <a
          href="/me/subscription"
          className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[var(--border)] text-[var(--fg)] text-sm font-bold hover:bg-[var(--bg-muted)] transition"
        >
          إدارة الاشتراك
        </a>
      ) : (
        <a
          href={`/me/subscription?subscribe=${plan.id}`}
          className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-bold transition"
        >
          {price === 0 ? "ابدأ مجاناً" : "اشترك"}
        </a>
      )}
    </article>
  );
}

/** Turn a features JSON key/value into a readable Arabic phrase. */
function featureLabel(key: string, value: unknown): string {
  const map: Record<string, string> = {
    verified_badge: "شارة «بائع موثّق»",
    priority_support: "دعم ذو أولوية",
    bulk_import: "استيراد جماعي للإعلانات",
    analytics_dashboard: "لوحة تحليلات",
  };
  if (typeof value === "boolean") {
    return value ? (map[key] ?? key) : "";
  }
  if (key === "pin_7d_price_sar") return `تثبيت إعلان لمدة 7 أيام بـ ${value} ر.س`;
  if (key === "homepage_3d_price_sar")
    return `ظهور على الرئيسية لمدة 3 أيام بـ ${value} ر.س`;
  if (key === "trial_days") return `${value} يوم تجربة مجانية`;
  return `${map[key] ?? key}: ${String(value)}`;
}
