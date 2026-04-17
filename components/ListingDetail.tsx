"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Gavel,
  FileCheck,
  Calendar,
  Tag,
  ShieldCheck,
  Settings2,
  Pencil,
} from "lucide-react";
import type { MarketplaceListing } from "@/lib/supabase/types";
import DecideDestinationModal from "@/components/DecideDestinationModal";

const SECTION_LABELS: Record<string, string> = {
  showrooms: "معارض السيارات",
  "specialized-cars": "السيارات المتخصصة",
  "real-estate": "سوق العقار",
  produce: "الخضار والفواكه",
  electronics: "الأجهزة النوعية",
  livestock: "المواشي",
  arts: "الفنون",
  "general-markets": "الأسواق العامة",
};

interface Props {
  listing: MarketplaceListing;
  /** True when the current Sanctum-authenticated viewer is the user who
   *  posted this listing. Swaps the bid/contact panel for a seller panel
   *  that opens DecideDestinationModal. */
  isOwner?: boolean;
}

export default function ListingDetail({ listing, isOwner = false }: Props) {
  const images =
    Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : [
          "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80",
        ];
  const [active, setActive] = useState(0);
  const [decideOpen, setDecideOpen] = useState(false);

  // Seller controls only make sense when the listing is backed by a Core
  // Car (classified→auction move goes through /api/cars/{id}/publish/*).
  // Non-car listings (electronics, real-estate, …) aren't auctionable yet,
  // so we hide the destination panel for them even if isOwner is true.
  const canManageDestination =
    isOwner &&
    listing.external_listable_type === "Car" &&
    listing.external_listable_id != null;
  const section = SECTION_LABELS[listing.section_slug] ?? listing.section_slug;
  const priceLabel = listing.price
    ? Number(listing.price).toLocaleString("ar-SA")
    : null;

  // Fire view tracking once per page load
  useEffect(() => {
    const url = `/api/v1/listings/${listing.id}/view`;
    const body = JSON.stringify({});
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [listing.id]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-[var(--fg-muted)] mb-4 flex items-center gap-2">
        <a href="/" className="hover:text-[var(--brand-700)]">الرئيسية</a>
        <span>›</span>
        <a
          href={`/s/${listing.section_slug}`}
          className="hover:text-[var(--brand-700)]"
        >
          {section}
        </a>
        <span>›</span>
        <span className="truncate text-[var(--fg-soft)]">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* LEFT — gallery + details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="relative aspect-[4/3] bg-[var(--bg-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[active]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[var(--brand-600)] text-white text-xs font-bold shadow">
                {section}
              </span>
            </div>
            {images.length > 1 && (
              <div className="p-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition
                      ${active === i ? "border-[var(--brand-600)]" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title block */}
          <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-[var(--border)]">
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight mb-3">
              {listing.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--fg-muted)] mb-4">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {listing.city ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {listing.views_count} مشاهدة
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {listing.published_at
                  ? new Date(listing.published_at).toLocaleDateString("ar-SA")
                  : "—"}
              </span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="prose prose-sm max-w-none text-[var(--fg)] leading-relaxed whitespace-pre-wrap border-t border-[var(--border-soft)] pt-4 mt-2">
                {listing.description}
              </div>
            )}

            {/* Tag chip */}
            {listing.tag_slug && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-soft)]">
                <Tag className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-muted)] text-[var(--fg)] font-medium">
                  {listing.tag_slug}
                </span>
              </div>
            )}
          </div>

          {/* Safety hints */}
          <div className="rounded-2xl p-4 bg-[var(--brand-50)] border border-[var(--brand-200)]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[var(--brand-700)] shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--brand-800)] leading-relaxed">
                <p className="font-bold mb-1">تعامل بأمان</p>
                <p>
                  تواصل مع البائع داخل المنصة عبر المحادثة المدمجة. تأكّد من
                  فحص المنتج قبل التحويل. لا تحوّل أي مبالغ خارج المنصة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — price + actions (sticky 1 col) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
              {priceLabel ? (
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-[var(--brand-700)] tabular-nums">
                      {priceLabel}
                    </span>
                    <span className="text-sm text-[var(--fg-muted)] font-bold">ر.س</span>
                  </div>
                  {listing.is_negotiable && (
                    <p className="text-xs text-[var(--fg-muted)] mt-1">قابل للتفاوض</p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-bold text-[var(--fg-muted)] mb-4">السعر عند الطلب</p>
              )}

              {isOwner ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1 px-2 py-1.5 rounded-lg bg-[var(--brand-50)] border border-[var(--brand-200)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-700)] shrink-0" />
                    <span className="text-[11px] font-bold text-[var(--brand-800)]">
                      هذا إعلانك — أنت تتحكم فيه
                    </span>
                  </div>

                  {canManageDestination && (
                    <button
                      onClick={() => setDecideOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold shadow-md transition"
                    >
                      <Settings2 className="w-4 h-4" />
                      إدارة الوجهة (سوق داسم / مزاد)
                    </button>
                  )}

                  <a
                    href="/me"
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--border-soft)] text-[var(--fg)] font-bold border border-[var(--border)] transition"
                  >
                    <Pencil className="w-4 h-4" />
                    افتح مساحتي للتحرير
                  </a>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {listing.is_auctionable && (
                      <button className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--accent-orange)] hover:opacity-90 text-white font-bold shadow-md transition">
                        <Gavel className="w-4 h-4" />
                        قدّم مزايدة
                      </button>
                    )}

                    <button
                      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold shadow-md transition"
                      data-dasm-talk="open"
                      data-dasm-talk-entity-type="marketplace_listing"
                      data-dasm-talk-entity-id={listing.id}
                    >
                      <MessageCircle className="w-4 h-4" />
                      ابدأ محادثة مع البائع
                    </button>

                    {listing.requires_settlement && (
                      <button className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)] hover:text-white text-[var(--accent-blue)] font-bold border border-[var(--accent-blue)]/30 transition">
                        <FileCheck className="w-4 h-4" />
                        بدء الإجراءات الرسمية
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--border-soft)]">
                    <button className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[var(--border)] hover:border-[var(--brand-600)] hover:text-[var(--brand-700)] text-xs font-semibold transition">
                      <Heart className="w-3.5 h-3.5" />
                      حفظ
                    </button>
                    <button className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[var(--border)] hover:border-[var(--brand-600)] hover:text-[var(--brand-700)] text-xs font-semibold transition">
                      <Share2 className="w-3.5 h-3.5" />
                      مشاركة
                    </button>
                  </div>
                </>
              )}
            </div>

            {!isOwner && (
              <div className="rounded-2xl p-4 bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] grid place-items-center text-white font-extrabold">
                    ب
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">بائع سوق داسم</div>
                    <div className="text-xs text-[var(--fg-muted)]">
                      مُسجَّل في منصة داسم
                    </div>
                  </div>
                </div>
                <a
                  href={`https://www.dasm.com.sa/users/${listing.external_user_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 text-center text-xs font-bold text-[var(--brand-700)] hover:underline"
                >
                  عرض الملف الشخصي ←
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {decideOpen && canManageDestination && (
        <DecideDestinationModal
          carId={listing.external_listable_id as number}
          carLabel={listing.title}
          prefillPrices={{ fixed_price: listing.price }}
          currentState={{
            inSouq: listing.status === "active" && !listing.is_auctionable,
            inAuction: listing.is_auctionable,
            souqListingId: listing.id,
            souqViews: listing.views_count,
            souqFavorites: listing.favorites_count,
            souqPublishedAt: listing.published_at,
          }}
          onClose={() => setDecideOpen(false)}
          onSuccess={() => {
            setDecideOpen(false);
            // Core is source of truth; reload so Services-DB listing
            // reflects the new listing_type/auction_status on next fetch.
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
      )}
    </main>
  );
}
