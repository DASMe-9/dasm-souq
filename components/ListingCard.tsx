import { Eye, Heart, MapPin, Gavel, BadgeCheck, Clock } from "lucide-react";
import type { InspectionSummary, MarketplaceListing } from "@/lib/supabase/types";
import { formatRelativeArabic } from "@/lib/time";

/**
 * Single listing card. Used in:
 *   • FeaturedListings (home page "إعلانات مميّزة")
 *   • /listings  (full catalog)
 *   • /s/[slug]  (section-scoped catalog)
 *
 * Kept pure / server-renderable — no hooks. The favourite button is
 * a placeholder client action that won't ship until we wire the
 * favourites endpoint in DASM-services.
 */

export const SECTION_LABELS: Record<string, string> = {
  showrooms: "🚗 معارض السيارات",
  "specialized-cars": "🏆 السيارات المتخصصة",
  "real-estate": "🏠 سوق العقار",
  produce: "🥬 الخضار والفواكه",
  electronics: "📱 الأجهزة النوعية",
  livestock: "🐪 المواشي",
  arts: "🎨 الفنون",
  "general-markets": "🛒 الأسواق العامة",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&q=80";

export interface DisplayListing {
  id: string;
  title: string;
  price: number | null;
  city: string;
  section: string;
  image: string;
  views: number;
  isAuctionable: boolean;
  /** Present when a verified inspection report exists for this listing.
   *  Surfaced as a compact "✅ فحص موثّق" badge. */
  inspection?: InspectionSummary;
  /** ISO timestamp used by the card to render a "قبل X" freshness label.
   *  Prefer the publish time; fall back to last update. */
  freshnessIso?: string | null;
  isDemo?: boolean;
}

export function toDisplay(
  l: MarketplaceListing,
  inspection?: InspectionSummary,
): DisplayListing {
  return {
    id: l.id,
    title: l.title,
    price: l.price != null ? Number(l.price) : null,
    city: l.city || "—",
    section: SECTION_LABELS[l.section_slug] || l.section_slug,
    image:
      Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : FALLBACK_IMAGE,
    views: l.views_count ?? 0,
    isAuctionable: l.is_auctionable,
    inspection,
    freshnessIso: l.published_at ?? l.updated_at ?? l.created_at ?? null,
  };
}

export default function ListingCard({ listing }: { listing: DisplayListing }) {
  const href = listing.isDemo ? "#" : `/listings/${listing.id}`;
  return (
    <article className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden card-lift">
      <a
        href={href}
        className="block relative aspect-[4/3] overflow-hidden bg-[var(--bg-muted)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <button
          type="button"
          className="absolute top-2 left-2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm grid place-items-center hover:bg-white transition shadow-md"
          aria-label="إضافة للمفضلة"
        >
          <Heart className="w-4 h-4 text-[var(--fg)]" />
        </button>
        <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm">
          {listing.section}
        </span>
        {listing.inspection && (
          <span
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md"
            title={
              listing.inspection.rating != null
                ? `فحص موثّق — تقييم ${listing.inspection.rating}/10`
                : "فحص موثّق"
            }
          >
            <BadgeCheck className="w-3 h-3" />
            فحص موثّق
            {listing.inspection.rating != null && (
              <span className="tabular-nums">{listing.inspection.rating}/10</span>
            )}
          </span>
        )}
      </a>

      <div className="p-3.5 space-y-2.5">
        <a href={href} className="block">
          <h3 className="font-bold text-sm leading-snug line-clamp-2 min-h-[2.5rem] hover:text-[var(--brand-700)] transition">
            {listing.title}
          </h3>
        </a>

        <div className="flex items-baseline gap-1.5">
          {listing.price != null ? (
            <>
              <span className="text-xl font-extrabold text-[var(--brand-700)] tabular-nums">
                {listing.price.toLocaleString("ar-SA")}
              </span>
              <span className="text-xs text-[var(--fg-muted)] font-bold">
                ر.س
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-[var(--fg-muted)]">
              السعر عند الطلب
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--fg-muted)] pt-2 border-t border-[var(--border-soft)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.city}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Eye className="w-3 h-3" />
            {listing.views.toLocaleString("ar-SA")}
          </span>
        </div>

        {listing.freshnessIso && (
          <div className="text-[10px] text-[var(--fg-soft)] inline-flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatRelativeArabic(listing.freshnessIso)}
          </div>
        )}

        {listing.isAuctionable && (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] text-[10px] font-bold">
              <Gavel className="w-3 h-3" />
              قابل للمزاد
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
