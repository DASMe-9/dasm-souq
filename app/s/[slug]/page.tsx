import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingsCatalog from "@/components/ListingsCatalog";
import { fetchSections, type MarketSection } from "@/lib/api";
import { fetchInspectionsForListings, fetchListings } from "@/lib/listings";
import type { InspectionSummary, ListingFilters, ListingsPage } from "@/lib/supabase/types";

/**
 * /s/[slug] — section-scoped listings page.
 *
 * Example URLs the home-page CategoriesGrid links to:
 *   /s/showrooms
 *   /s/specialized-cars
 *   /s/real-estate
 *   /s/electronics  ...etc
 *
 * Works for any slug surfaced by /api/marketplace/sections — admin
 * activates a section from /admin/regions and it becomes browsable
 * here automatically (no code change).
 *
 * Tag filtering (?tag=toyota) is supported via the tag pills rendered
 * below the title. Other filters (q / price / sort) come from
 * ListingsCatalog's built-in form.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ slug: string }>;

export const revalidate = 120;

async function findSectionBySlug(slug: string): Promise<MarketSection | null> {
  try {
    const sections = await fetchSections(true);
    return sections.find((s) => s.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const section = await findSectionBySlug(slug);
  if (!section) {
    return { title: "قسم غير معروف — سوق داسم" };
  }
  return {
    title: `${section.name_ar} — سوق داسم`,
    description: `تصفّح إعلانات ${section.name_ar} في سوق داسم مباشرة — بدون وسيط.`,
  };
}

function readFilters(
  raw: Record<string, string | string[] | undefined>,
): Omit<ListingFilters, "section"> {
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
    tag: one(raw.tag) || undefined,
    area: one(raw.area) || undefined,
    minPrice: asNum(one(raw.minPrice)),
    maxPrice: asNum(one(raw.maxPrice)),
    page: asNum(one(raw.page)) ?? 1,
    perPage: 24,
    sort: asSort(one(raw.sort)),
  };
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);

  const section = await findSectionBySlug(slug);
  if (!section) {
    notFound();
  }

  const filters = readFilters(raw);

  let page: ListingsPage;
  let error: string | null = null;
  try {
    page = await fetchListings({ ...filters, section: slug });
  } catch (e) {
    error = e instanceof Error ? e.message : "خطأ غير معروف";
    page = { items: [], total: 0, page: 1, perPage: filters.perPage ?? 24, hasMore: false };
  }

  // Batch-load verified inspection badges. Swallow errors so a missing
  // service-role key or a momentary blip never hides the listings.
  let inspections: Record<string, InspectionSummary> = {};
  if (page.items.length > 0) {
    try {
      inspections = await fetchInspectionsForListings(
        page.items.map((l) => l.id),
      );
    } catch {
      inspections = {};
    }
  }

  return (
    <>
      <Header />
      <main>
        {/* Breadcrumbs */}
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 text-xs text-[var(--fg-muted)]"
          dir="rtl"
        >
          <a href="/" className="hover:text-[var(--brand-700)]">
            الرئيسية
          </a>{" "}
          /{" "}
          <a href="/listings" className="hover:text-[var(--brand-700)]">
            كل الإعلانات
          </a>{" "}
          / <span className="text-[var(--fg)]">{section.name_ar}</span>
        </div>

        {/* Tag pills */}
        {section.children && section.children.length > 0 && (
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex flex-wrap gap-2"
            dir="rtl"
          >
            <TagPill
              slug={slug}
              active={!filters.tag}
              label="الكل"
              preserveQ={filters.q}
              preserveSort={filters.sort}
            />
            {section.children
              .filter((t) => t.is_active)
              .map((tag) => (
                <TagPill
                  key={tag.id}
                  slug={slug}
                  tag={tag.slug}
                  active={filters.tag === tag.slug}
                  label={tag.name_ar}
                  preserveQ={filters.q}
                  preserveSort={filters.sort}
                />
              ))}
          </div>
        )}

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
          title={`${section.icon ?? ""} ${section.name_ar}`.trim()}
          subtitle={`كل إعلانات قسم ${section.name_ar} في سوق داسم.`}
          page={page}
          filters={{
            q: filters.q,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            sort: filters.sort,
          }}
          basePath={`/s/${slug}`}
          preserve={{ tag: filters.tag, area: filters.area }}
          inspections={inspections}
        />
      </main>
      <Footer />
    </>
  );
}

function TagPill({
  slug,
  tag,
  active,
  label,
  preserveQ,
  preserveSort,
}: {
  slug: string;
  tag?: string;
  active: boolean;
  label: string;
  preserveQ?: string;
  preserveSort?: string;
}) {
  const qs = new URLSearchParams();
  if (tag) qs.set("tag", tag);
  if (preserveQ) qs.set("q", preserveQ);
  if (preserveSort) qs.set("sort", preserveSort);
  const href = `/s/${slug}${qs.size ? `?${qs.toString()}` : ""}`;
  return (
    <a
      href={href}
      className={
        active
          ? "inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--brand-600)] text-white text-xs font-bold shadow-sm"
          : "inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--bg-muted)] text-[var(--fg)] text-xs font-semibold hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition"
      }
    >
      {label}
    </a>
  );
}
