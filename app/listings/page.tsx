import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingsCatalog from "@/components/ListingsCatalog";
import { fetchListings } from "@/lib/listings";
import type { ListingFilters, ListingsPage } from "@/lib/supabase/types";

/**
 * /listings — full public catalog of every active listing across the
 * souq. Used as the "عرض الكل" target from FeaturedListings on the
 * home page, and as a crawlable landing for SEO.
 *
 * All filters are URL-bound so Arabic search engines and social
 * previews see the same content users see. No client JS is required
 * to apply a filter — the form GETs back to /listings with query
 * params.
 */

export const metadata: Metadata = {
  title: "كل الإعلانات — سوق داسم",
  description:
    "تصفّح جميع الإعلانات في سوق داسم: سيارات، عقار، أجهزة، وأكثر — بحث وفلترة مباشرة.",
};

// Short cache so new listings surface quickly without hammering Supabase.
export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFilters(raw: Record<string, string | string[] | undefined>): ListingFilters {
  const one = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v;
  const asNum = (v: string | undefined): number | undefined => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const asSort = (v: string | undefined): ListingFilters["sort"] => {
    if (v === "price_asc" || v === "price_desc" || v === "popular" || v === "latest") {
      return v;
    }
    return "latest";
  };
  return {
    q: one(raw.q) || undefined,
    section: one(raw.section) || undefined,
    tag: one(raw.tag) || undefined,
    area: one(raw.area) || undefined,
    minPrice: asNum(one(raw.minPrice)),
    maxPrice: asNum(one(raw.maxPrice)),
    page: asNum(one(raw.page)) ?? 1,
    perPage: 24,
    sort: asSort(one(raw.sort)),
  };
}

export default async function AllListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const filters = readFilters(raw);

  let page: ListingsPage;
  let error: string | null = null;
  try {
    page = await fetchListings(filters);
  } catch (e) {
    error = e instanceof Error ? e.message : "خطأ غير معروف";
    page = { items: [], total: 0, page: 1, perPage: filters.perPage ?? 24, hasMore: false };
  }

  return (
    <>
      <Header />
      <main>
        {error && (
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 pt-6"
            dir="rtl"
          >
            <div className="rounded-2xl border border-red-300 bg-red-50 text-red-700 p-4 text-sm dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
              تعذّر تحميل الإعلانات: {error}
            </div>
          </div>
        )}
        <ListingsCatalog
          title="كل الإعلانات"
          subtitle="جميع الإعلانات الحيّة في سوق داسم — استخدم الفلاتر لتضييق النتائج."
          page={page}
          filters={{
            q: filters.q,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            sort: filters.sort,
          }}
          basePath="/listings"
          preserve={{ section: filters.section, tag: filters.tag, area: filters.area }}
        />
      </main>
      <Footer />
    </>
  );
}
