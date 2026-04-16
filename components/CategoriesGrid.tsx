import type { MarketSection } from "@/lib/api";

interface Props {
  sections: MarketSection[];
  error: string | null;
}

/**
 * Compact Haraj-style category strip for the souq home page.
 *
 * Owner 2026-04-16: the previous big 4-column card grid was taking
 * half the first paint. Reference point = Haraj's category strip:
 * tiny icon + tiny label, many categories per row, minimal padding.
 *
 * Current render: responsive grid that goes 4→6→8→10 columns,
 * each cell is just a colored icon chip + short label. No glow,
 * no tags preview, no "ادخل القسم" affordance — clicking the cell
 * is the affordance. The category label + icon are the content.
 */
export default function CategoriesGrid({ sections, error }: Props) {
  return (
    <section
      id="categories"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
      dir="rtl"
    >
      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 text-sm mb-4">
          تعذّر تحميل الأقسام: {error}
        </div>
      )}

      {!error && sections.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center text-[var(--fg-muted)]">
          لا توجد أقسام مفعّلة حالياً. عُد قريباً.
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
        {sections.map((s, i) => (
          <CategoryChip key={s.id} section={s} index={i} />
        ))}
      </div>
    </section>
  );
}

const ACCENT_PALETTE = [
  { from: "#10b981", to: "#047857" }, // emerald
  { from: "#f97316", to: "#c2410c" }, // orange
  { from: "#3b82f6", to: "#1d4ed8" }, // blue
  { from: "#8b5cf6", to: "#6d28d9" }, // violet
  { from: "#ec4899", to: "#be185d" }, // pink
  { from: "#14b8a6", to: "#0f766e" }, // teal
  { from: "#eab308", to: "#a16207" }, // yellow
  { from: "#ef4444", to: "#b91c1c" }, // red
];

function CategoryChip({
  section,
  index,
}: {
  section: MarketSection;
  index: number;
}) {
  const accent = ACCENT_PALETTE[index % ACCENT_PALETTE.length];

  return (
    <a
      href={`/s/${section.slug}`}
      className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[var(--bg-muted)] transition"
      title={section.name_ar}
    >
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl grid place-items-center text-lg sm:text-xl shadow-sm group-hover:scale-105 transition-transform"
        style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
      >
        <span className="filter drop-shadow-sm">{section.icon ?? "📦"}</span>
      </div>
      <span className="text-[11px] sm:text-xs font-semibold text-[var(--fg)] text-center leading-tight line-clamp-2 group-hover:text-[var(--brand-700)] transition">
        {section.name_ar}
      </span>
    </a>
  );
}
