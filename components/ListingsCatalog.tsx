import { Search, Inbox } from "lucide-react";
import ListingCard, { toDisplay, type DisplayListing } from "@/components/ListingCard";
import type { InspectionSummary, ListingsPage } from "@/lib/supabase/types";

/**
 * Server-rendered listings catalog. Used by:
 *   • /listings          — all listings
 *   • /s/[slug]          — scoped to a section (section is locked)
 *
 * Filter UI is a plain HTML form that GETs back to the same page with
 * query params — no client JS needed for the core flow. Keeps the
 * page streamable and cheap to render.
 */

interface FilterState {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "latest" | "price_asc" | "price_desc" | "popular";
}

interface Props {
  title: string;
  subtitle?: string;
  page: ListingsPage;
  /** Current filter state — echoed back into the form */
  filters: FilterState;
  /** Base path the form submits to (e.g. "/listings" or "/s/real-estate") */
  basePath: string;
  /** Hidden fields to preserve (section, tag, area, etc.) across filter changes */
  preserve?: Record<string, string | undefined>;
  /** Optional map of listing_id → verified inspection summary. Rendered
   *  as a badge on each card. Batch-fetched at the page level to keep
   *  this component free of any data access. */
  inspections?: Record<string, InspectionSummary>;
}

const SORT_LABELS: Record<NonNullable<FilterState["sort"]>, string> = {
  latest: "الأحدث",
  price_asc: "السعر: من الأقل",
  price_desc: "السعر: من الأكثر",
  popular: "الأكثر مشاهدة",
};

export default function ListingsCatalog({
  title,
  subtitle,
  page,
  filters,
  basePath,
  preserve = {},
  inspections = {},
}: Props) {
  const items: DisplayListing[] = page.items.map((l) =>
    toDisplay(l, inspections[l.id]),
  );
  const totalPages = Math.max(1, Math.ceil(page.total / page.perPage));

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10" dir="rtl">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--fg-muted)]">{subtitle}</p>
        )}
        <p className="text-xs text-[var(--fg-soft)] mt-2 tabular-nums">
          {page.total.toLocaleString("ar-SA")} إعلان
          {page.total > page.perPage &&
            ` — صفحة ${page.page} من ${totalPages}`}
        </p>
      </div>

      {/* Filters */}
      <form
        action={basePath}
        method="get"
        className="mb-6 flex flex-wrap gap-2 items-end rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3"
      >
        {/* Preserve non-user-editable context (section, tag, area, etc.) */}
        {Object.entries(preserve).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null,
        )}

        {/* Search */}
        <label className="flex-1 min-w-[180px]">
          <span className="block text-[11px] font-bold mb-1">بحث</span>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              placeholder="كلمة من العنوان..."
              className="w-full h-10 pr-9 pl-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:border-[var(--brand-500)]"
            />
          </div>
        </label>

        {/* Min price */}
        <label className="w-32">
          <span className="block text-[11px] font-bold mb-1">السعر من</span>
          <input
            name="minPrice"
            type="number"
            min={0}
            defaultValue={filters.minPrice ?? ""}
            placeholder="0"
            className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm tabular-nums focus:outline-none focus:border-[var(--brand-500)]"
          />
        </label>

        {/* Max price */}
        <label className="w-32">
          <span className="block text-[11px] font-bold mb-1">إلى</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={filters.maxPrice ?? ""}
            placeholder="—"
            className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm tabular-nums focus:outline-none focus:border-[var(--brand-500)]"
          />
        </label>

        {/* Sort */}
        <label className="w-44">
          <span className="block text-[11px] font-bold mb-1">الترتيب</span>
          <select
            name="sort"
            defaultValue={filters.sort ?? "latest"}
            className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:border-[var(--brand-500)]"
          >
            {Object.entries(SORT_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="h-10 px-5 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-bold transition"
        >
          بحث
        </button>
      </form>

      {/* Grid or empty */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center text-[var(--fg-muted)]">
          <Inbox className="w-10 h-10 mx-auto mb-3 text-[var(--fg-soft)]" />
          <p className="text-sm">
            لا توجد إعلانات تطابق البحث. جرّب توسيع النطاق أو تغيير القسم.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-2"
          aria-label="ترقيم الصفحات"
        >
          <PageLink
            basePath={basePath}
            filters={filters}
            preserve={preserve}
            targetPage={page.page - 1}
            currentPage={page.page}
            disabled={page.page <= 1}
          >
            السابق
          </PageLink>
          <span className="px-3 text-sm text-[var(--fg-muted)] tabular-nums">
            {page.page} / {totalPages}
          </span>
          <PageLink
            basePath={basePath}
            filters={filters}
            preserve={preserve}
            targetPage={page.page + 1}
            currentPage={page.page}
            disabled={!page.hasMore}
          >
            التالي
          </PageLink>
        </nav>
      )}
    </section>
  );
}

function PageLink({
  basePath,
  filters,
  preserve,
  targetPage,
  currentPage,
  disabled,
  children,
}: {
  basePath: string;
  filters: FilterState;
  preserve: Record<string, string | undefined>;
  targetPage: number;
  currentPage: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="h-10 px-4 inline-flex items-center rounded-lg border border-[var(--border)] text-[var(--fg-soft)] text-sm font-bold opacity-60 cursor-not-allowed">
        {children}
      </span>
    );
  }
  const qs = new URLSearchParams();
  Object.entries(preserve).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  if (filters.q) qs.set("q", filters.q);
  if (filters.minPrice != null) qs.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) qs.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) qs.set("sort", filters.sort);
  qs.set("page", String(targetPage));
  void currentPage; // kept for future "active page" styling
  return (
    <a
      href={`${basePath}?${qs.toString()}`}
      className="h-10 px-4 inline-flex items-center rounded-lg border border-[var(--border)] hover:border-[var(--brand-500)] hover:text-[var(--brand-700)] text-sm font-bold transition"
    >
      {children}
    </a>
  );
}
