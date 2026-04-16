import {
  ShoppingBag,
  Eye,
  Heart,
  MapPin,
  Pause,
  CheckCircle2,
  Clock,
  Inbox,
  ExternalLink,
} from "lucide-react";
import type { MeListing, MeListingsData } from "@/lib/listings-me";
import { SECTION_LABELS } from "@/components/ListingCard";

/**
 * Non-car "مساحتي" listings block for /me.
 *
 * Renders below GarageView (cars) so the seller sees their full
 * inventory on one page:
 *   1. سياراتي           (GarageView)
 *   2. إعلاناتي الأخرى    (this component)
 *
 * Data source: fetchUserListings() → /api/me/listings (Core proxy
 * to DASM-services marketplace_listings).
 */

const STATUS_LABEL: Record<string, { text: string; color: string; icon: React.ElementType }> = {
  active: {
    text: "نشط",
    color: "bg-emerald-600 text-white",
    icon: CheckCircle2,
  },
  paused: {
    text: "موقوف",
    color: "bg-slate-600 text-white",
    icon: Pause,
  },
  sold: {
    text: "مباع",
    color: "bg-blue-600 text-white",
    icon: CheckCircle2,
  },
  pending: {
    text: "بانتظار المراجعة",
    color: "bg-amber-500 text-white",
    icon: Clock,
  },
  expired: {
    text: "منتهٍ",
    color: "bg-stone-500 text-white",
    icon: Clock,
  },
};

export default function MyListingsView({ data }: { data: MeListingsData | null }) {
  if (!data || data.listings.length === 0) {
    return (
      <section dir="rtl" className="space-y-3">
        <Heading summary={data?.summary} />
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[var(--brand-50)] items-center justify-center mb-3">
            <ShoppingBag className="w-6 h-6 text-[var(--brand-600)]" />
          </div>
          <p className="text-sm text-[var(--fg-muted)] mb-4">
            لم تنشر إعلاناً في الأقسام غير السيارات بعد.
          </p>
          <a
            href="/publish"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm transition"
          >
            أضف إعلانك الأول
          </a>
        </div>
      </section>
    );
  }

  return (
    <section dir="rtl" className="space-y-3">
      <Heading summary={data.summary} />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <ul className="divide-y divide-[var(--border-soft)]">
          {data.listings.map((l) => (
            <ListingRow key={l.id} listing={l} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Heading({ summary }: { summary?: MeListingsData["summary"] }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-2">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-[var(--fg)]">
          إعلاناتي الأخرى
        </h2>
        <p className="text-xs text-[var(--fg-muted)] mt-0.5">
          إعلاناتك في سوق داسم (عقار، أجهزة، أثاث، مواشي، سلع متنوعة).
        </p>
      </div>
      {summary && summary.total > 0 && (
        <div className="flex items-center gap-1.5 text-[11px]">
          <Pill label={`${summary.total} إجمالي`} tone="brand" />
          {summary.active > 0 && (
            <Pill label={`${summary.active} نشط`} tone="emerald" />
          )}
          {summary.pending > 0 && (
            <Pill label={`${summary.pending} بانتظار`} tone="amber" />
          )}
          {summary.sold > 0 && (
            <Pill label={`${summary.sold} مباع`} tone="blue" />
          )}
        </div>
      )}
    </div>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "brand" | "emerald" | "amber" | "blue";
}) {
  const map = {
    brand: "bg-[var(--brand-50)] text-[var(--brand-700)]",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  } as const;
  return (
    <span className={`px-2 py-0.5 rounded-full font-bold ${map[tone]}`}>
      {label}
    </span>
  );
}

function ListingRow({ listing }: { listing: MeListing }) {
  const cover = listing.images[0];
  const sectionLabel = SECTION_LABELS[listing.section_slug] ?? listing.section_slug;
  const statusMeta =
    STATUS_LABEL[listing.status] ?? {
      text: listing.status,
      color: "bg-stone-500 text-white",
      icon: Clock,
    };
  const StatusIcon = statusMeta.icon;
  const price =
    listing.price != null
      ? `${Number(listing.price).toLocaleString("ar-SA")} ر.س`
      : "السعر عند التواصل";

  return (
    <li>
      <div className="flex items-center gap-3 p-3 hover:bg-[var(--bg-muted)] transition">
        {/* Thumbnail */}
        <div className="w-16 h-14 rounded-lg overflow-hidden bg-[var(--bg-muted)] grid place-items-center shrink-0">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="w-5 h-5 text-[var(--fg-muted)]" />
          )}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-sm text-[var(--fg)] truncate">
              {listing.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusMeta.color}`}
            >
              <StatusIcon className="w-2.5 h-2.5" />
              {statusMeta.text}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[var(--fg-muted)]">
            <span>{sectionLabel}</span>
            {listing.city && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {listing.city}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {listing.views_count}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Heart className="w-3 h-3" />
              {listing.favorites_count}
            </span>
          </div>
        </div>

        {/* Price + link */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-sm font-extrabold text-[var(--brand-700)] tabular-nums hidden sm:block">
            {price}
          </div>
          <a
            href={`/listings/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-[11px] font-bold transition"
            title="عرض الإعلان"
          >
            <ExternalLink className="w-3 h-3" />
            عرض
          </a>
        </div>
      </div>
    </li>
  );
}
