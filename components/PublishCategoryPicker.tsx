import {
  ChevronLeft,
  Car,
  Trophy,
  Home,
  Apple,
  Smartphone,
  Palette,
  ShoppingBag,
  Package,
  Rabbit,
} from "lucide-react";
/** Slim section shape shared with fetchCoreSections() in lib/auth.
 *  The API endpoint filters to active sections server-side, so this
 *  component doesn't need an is_active field. */
interface PickerSection {
  id: number;
  slug: string;
  name_ar: string;
  icon: string | null;
}

/**
 * Haraj-style "choose what you're listing" step.
 *
 * Rendered on /publish before the form. The seller picks a section,
 * which navigates to /publish?type=<slug> with the form pre-bound to
 * that section. Wording uses "إعلان" (owner preference) instead of
 * Haraj's "عرض".
 *
 * Each row: icon right · label · chevron left (← meaning "enter").
 *
 * The icon + label copy are local to this picker — they're the
 * "listing intent" copy, distinct from the shorter category names
 * shown on the home CategoriesGrid.
 */

interface RowCopy {
  /** Lucide / react-icons component */
  icon: React.ElementType;
  /** Full Haraj-style intent phrase */
  label: string;
  /** Tailwind accent for the icon tile */
  accent: string;
}

const SECTION_COPY: Record<string, RowCopy> = {
  showrooms: {
    icon: Car,
    label: "إعلان سيارة للبيع أو للتنازل",
    accent: "bg-red-500/10 text-red-500",
  },
  "specialized-cars": {
    icon: Trophy,
    label: "إعلان سيارة متخصصة (كلاسيكية، رالي، فخمة...)",
    accent: "bg-amber-500/10 text-amber-500",
  },
  "real-estate": {
    icon: Home,
    label: "إعلان عقار للبيع أو للإيجار",
    accent: "bg-blue-500/10 text-blue-500",
  },
  produce: {
    icon: Apple,
    label: "إعلان خضار أو فواكه",
    accent: "bg-emerald-500/10 text-emerald-500",
  },
  electronics: {
    icon: Smartphone,
    label: "إعلان جهاز للبيع",
    accent: "bg-violet-500/10 text-violet-500",
  },
  livestock: {
    // lucide doesn't ship a cow/camel/sheep icon; Rabbit is the
    // closest livestock stand-in. The section's own emoji (🐪) is
    // still shown elsewhere (home CategoriesGrid) so users who
    // associate the section with camels aren't lost.
    icon: Rabbit,
    label: "إعلان مواشي للبيع",
    accent: "bg-orange-500/10 text-orange-500",
  },
  arts: {
    icon: Palette,
    label: "إعلان عمل فني",
    accent: "bg-pink-500/10 text-pink-500",
  },
  "general-markets": {
    icon: ShoppingBag,
    label: "إعلان سلعة غير مصنفة أعلاه",
    accent: "bg-slate-500/10 text-slate-500",
  },
};

const FALLBACK_COPY: RowCopy = {
  icon: Package,
  label: "إعلان جديد",
  accent: "bg-slate-500/10 text-slate-500",
};

function copyFor(section: PickerSection): RowCopy {
  return SECTION_COPY[section.slug] ?? {
    ...FALLBACK_COPY,
    label: `إعلان في ${section.name_ar}`,
  };
}

export default function PublishCategoryPicker({
  sections,
}: {
  sections: PickerSection[];
}) {
  return (
    <div dir="rtl">
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
        إضافة إعلان جديد
      </h1>
      <p className="text-sm text-[var(--fg-muted)] mb-6">اختر نوع الإعلان</p>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center text-[var(--fg-muted)]">
          لا توجد أقسام مفعّلة حالياً. عُد قريباً.
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <ul className="divide-y divide-[var(--border-soft)]">
            {sections.map((s) => {
              const c = copyFor(s);
              const Icon = c.icon;
              return (
                <li key={s.id}>
                  <a
                    href={`/publish?type=${encodeURIComponent(s.slug)}`}
                    className="group flex items-center gap-3 p-4 hover:bg-[var(--bg-muted)] transition"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${c.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 text-sm sm:text-base font-semibold text-[var(--fg)]">
                      {c.label}
                    </span>
                    <ChevronLeft className="w-5 h-5 text-[var(--fg-muted)] group-hover:text-[var(--brand-700)] transition" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--fg-soft)] text-center">
        اختر أقرب تصنيف لإعلانك — يمكنك تعديل التفاصيل في الخطوة التالية.
      </p>
    </div>
  );
}
