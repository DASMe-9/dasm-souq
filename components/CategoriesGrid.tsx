import type { MarketSection } from "@/lib/api";
import { ChevronLeft } from "lucide-react";

interface Props {
  sections: MarketSection[];
  error: string | null;
}

export default function CategoriesGrid({ sections, error }: Props) {
  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Section header removed 2026-04-16 — owner felt the
          "تصفّح حسب القسم" title + subtitle were filler copy now
          that the categories are the first thing on the page. */}

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 text-sm">
          تعذّر تحميل الأقسام: {error}
        </div>
      )}

      {!error && sections.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center text-[var(--fg-muted)]">
          لا توجد أقسام مفعّلة حالياً. عُد قريباً.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {sections.map((s, i) => (
          <CategoryCard key={s.id} section={s} index={i} />
        ))}
      </div>
    </section>
  );
}

const ACCENT_PALETTE = [
  { from: "#10b981", to: "#047857", glow: "rgba(16,185,129,0.18)" },   // emerald
  { from: "#f97316", to: "#c2410c", glow: "rgba(249,115,22,0.18)" },   // orange
  { from: "#3b82f6", to: "#1d4ed8", glow: "rgba(59,130,246,0.18)" },   // blue
  { from: "#8b5cf6", to: "#6d28d9", glow: "rgba(139,92,246,0.18)" },   // violet
  { from: "#ec4899", to: "#be185d", glow: "rgba(236,72,153,0.18)" },   // pink
  { from: "#14b8a6", to: "#0f766e", glow: "rgba(20,184,166,0.18)" },   // teal
  { from: "#eab308", to: "#a16207", glow: "rgba(234,179,8,0.18)" },    // yellow
  { from: "#ef4444", to: "#b91c1c", glow: "rgba(239,68,68,0.18)" },    // red
];

function CategoryCard({ section, index }: { section: MarketSection; index: number }) {
  const accent = ACCENT_PALETTE[index % ACCENT_PALETTE.length];
  const tagCount = section.children?.length ?? 0;

  return (
    <a
      href={`/s/${section.slug}`}
      className="group relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4 sm:p-5 overflow-hidden card-lift block"
      style={{ minHeight: 160 }}
    >
      {/* Glow accent */}
      <div
        className="absolute -top-12 -left-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
        style={{ background: accent.glow }}
      />

      {/* Icon tile — shrunk 2026-04-16 per owner request so the
          category card feels lighter and less ornamental. */}
      <div
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl grid place-items-center text-lg sm:text-xl mb-2 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
      >
        <span className="filter drop-shadow-sm">{section.icon ?? "📦"}</span>
      </div>

      <h3 className="relative font-bold text-sm sm:text-base text-[var(--fg)] leading-tight mb-1 group-hover:text-[var(--brand-700)] transition">
        {section.name_ar}
      </h3>

      <p className="relative text-xs text-[var(--fg-muted)] mb-2">
        {tagCount > 0 ? `${tagCount} تصنيف` : "قسم رئيسي"}
      </p>

      {/* Tags preview */}
      {section.children && section.children.length > 0 && (
        <div className="relative flex flex-wrap gap-1 mb-3">
          {section.children.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--fg-muted)]"
            >
              {tag.name_ar}
            </span>
          ))}
          {section.children.length > 3 && (
            <span className="text-[10px] text-[var(--fg-soft)] px-1">+{section.children.length - 3}</span>
          )}
        </div>
      )}

      <div className="relative inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-700)] opacity-70 group-hover:opacity-100 group-hover:gap-2 transition-all">
        ادخل القسم
        <ChevronLeft className="w-3.5 h-3.5" />
      </div>
    </a>
  );
}
