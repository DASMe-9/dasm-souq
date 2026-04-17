import { Sparkles } from "lucide-react";
import { fetchInspectionsForListings, fetchListings } from "@/lib/listings";
import ListingCard, {
  toDisplay,
  type DisplayListing,
} from "@/components/ListingCard";

/**
 * Home-page "إعلانات مميّزة" strip. Pulls the 8 latest listings via
 * the same data layer used by /listings and /s/[slug]. If the DB is
 * unreachable or the seller pool is still empty, we fall back to a
 * handful of demo cards so the home page never looks broken.
 *
 * The card UI itself lives in components/ListingCard so the three
 * surfaces (home / all listings / section) stay pixel-consistent.
 */

const DEMO_LISTINGS: DisplayListing[] = [
  {
    id: "demo-1",
    title: "تويوتا كامري 2024 — حالة ممتازة",
    price: 85_000,
    city: "الرياض",
    section: "🚗 معارض السيارات",
    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80",
    views: 142,
    isAuctionable: true,
    isDemo: true,
  },
  {
    id: "demo-2",
    title: "شقة فاخرة في حي العليا — 4 غرف",
    price: 1_250_000,
    city: "الرياض",
    section: "🏠 سوق العقار",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80",
    views: 87,
    isAuctionable: false,
    isDemo: true,
  },
  {
    id: "demo-3",
    title: "آيفون 16 برو ماكس — جديد بضمان",
    price: 5_499,
    city: "جدة",
    section: "📱 سوق الأجهزة",
    image:
      "https://images.unsplash.com/photo-1592286927505-1def25115558?w=600&q=80",
    views: 230,
    isAuctionable: false,
    isDemo: true,
  },
  {
    id: "demo-4",
    title: "نيسان باترول 2023 — للبيع المستعجل",
    price: 195_000,
    city: "الدمام",
    section: "🚗 معارض السيارات",
    image:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",
    views: 312,
    isAuctionable: true,
    isDemo: true,
  },
];

export default async function FeaturedListings() {
  let listings: DisplayListing[] = [];
  let usingDemo = false;
  let fetchError: string | null = null;

  try {
    const page = await fetchListings({ perPage: 8, sort: "latest" });
    if (page.items.length > 0) {
      // Best-effort inspection lookup. A failure here shouldn't hide the
      // whole strip — just skip the badges. (e.g. missing service-role
      // key in a preview deploy.)
      let inspections: Awaited<ReturnType<typeof fetchInspectionsForListings>> = {};
      try {
        inspections = await fetchInspectionsForListings(
          page.items.map((l) => l.id),
        );
      } catch {
        inspections = {};
      }
      listings = page.items.map((l) => toDisplay(l, inspections[l.id]));
    } else {
      listings = DEMO_LISTINGS;
      usingDemo = true;
    }
  } catch (e) {
    // Missing env vars or DB unreachable → graceful demo fallback
    listings = DEMO_LISTINGS;
    usingDemo = true;
    fetchError = e instanceof Error ? e.message : String(e);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">
            إعلانات مميّزة
          </h2>
          <p className="text-sm text-[var(--fg-muted)]">
            مجموعة مختارة من أحدث وأقوى إعلانات السوق.
          </p>
        </div>
        <a
          href="/listings"
          className="text-sm font-bold text-[var(--brand-700)] hover:text-[var(--brand-800)] transition shrink-0"
        >
          عرض الكل ←
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>

      {usingDemo && (
        <p className="mt-4 text-xs text-center text-[var(--fg-soft)] inline-flex items-center justify-center gap-1.5 w-full">
          <Sparkles className="w-3.5 h-3.5" />
          {fetchError
            ? "بيانات تجريبية — الاتصال بقاعدة البيانات غير مكتمل بعد."
            : "بيانات تجريبية — لم يُنشر أي إعلان حقيقي بعد."}
        </p>
      )}
    </section>
  );
}
