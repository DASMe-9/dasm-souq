import { Eye, Heart, MapPin, MessageCircle, Gavel } from "lucide-react";

/**
 * Placeholder featured listings — uses static demo data until the
 * /api/marketplace/listings endpoint is wired (PR-4).
 */
const DEMO_LISTINGS = [
  {
    id: 1,
    title: "تويوتا كامري 2024 — حالة ممتازة",
    price: 85_000,
    city: "الرياض",
    section: "🚗 معارض السيارات",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80",
    views: 142,
    isAuctionable: true,
  },
  {
    id: 2,
    title: "شقة فاخرة في حي العليا — 4 غرف",
    price: 1_250_000,
    city: "الرياض",
    section: "🏠 سوق العقار",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80",
    views: 87,
    isAuctionable: false,
  },
  {
    id: 3,
    title: "آيفون 16 برو ماكس — جديد بضمان",
    price: 5_499,
    city: "جدة",
    section: "📱 سوق الأجهزة",
    image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=600&q=80",
    views: 230,
    isAuctionable: false,
  },
  {
    id: 4,
    title: "نيسان باترول 2023 — للبيع المستعجل",
    price: 195_000,
    city: "الدمام",
    section: "🚗 معارض السيارات",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",
    views: 312,
    isAuctionable: true,
  },
];

export default function FeaturedListings() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">إعلانات مميّزة</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            مجموعة مختارة من أحدث وأقوى إعلانات السوق.
          </p>
        </div>
        <a
          href="#"
          className="text-sm font-bold text-[var(--brand-700)] hover:text-[var(--brand-800)] transition shrink-0"
        >
          عرض الكل ←
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEMO_LISTINGS.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>

      <p className="mt-4 text-xs text-center text-[var(--fg-soft)]">
        ⚡ بيانات تجريبية — قريباً إعلانات حقيقية مباشرة من بائعي السوق.
      </p>
    </section>
  );
}

type Listing = (typeof DEMO_LISTINGS)[number];

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden card-lift">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <button className="absolute top-2 left-2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm grid place-items-center hover:bg-white transition shadow-md">
          <Heart className="w-4 h-4 text-[var(--fg)]" />
        </button>
        <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm">
          {listing.section}
        </span>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2.5">
        <h3 className="font-bold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {listing.title}
        </h3>

        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold text-[var(--brand-700)] tabular-nums">
            {listing.price.toLocaleString("ar-SA")}
          </span>
          <span className="text-xs text-[var(--fg-muted)] font-bold">ر.س</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--fg-muted)] pt-2 border-t border-[var(--border-soft)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {listing.views}
          </span>
        </div>

        {/* 3 buttons (preview of PR-4 spec) */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {listing.isAuctionable ? (
            <button className="inline-flex items-center justify-center gap-1 h-9 rounded-lg bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] hover:bg-[var(--accent-orange)] hover:text-white text-xs font-bold transition">
              <Gavel className="w-3.5 h-3.5" />
              قدّم مزايدة
            </button>
          ) : (
            <button className="inline-flex items-center justify-center gap-1 h-9 rounded-lg bg-[var(--bg-muted)] text-[var(--fg-muted)] text-xs font-bold cursor-not-allowed">
              غير متاح للمزاد
            </button>
          )}
          <button className="inline-flex items-center justify-center gap-1 h-9 rounded-lg bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] text-xs font-bold transition">
            <MessageCircle className="w-3.5 h-3.5" />
            ابدأ محادثة
          </button>
        </div>
      </div>
    </article>
  );
}
