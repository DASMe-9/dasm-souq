import { fetchSections } from "@/lib/api";
import { Store, Sparkles } from "lucide-react";

// Revalidate every 5 minutes so admin activations propagate quickly.
export const revalidate = 300;

export default async function HomePage() {
  let sections: Awaited<ReturnType<typeof fetchSections>> = [];
  let error: string | null = null;

  try {
    sections = await fetchSections(true);
  } catch (e) {
    error = e instanceof Error ? e.message : "خطأ غير معروف";
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="border-b border-[var(--border)] bg-gradient-to-bl from-[var(--primary)]/10 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--primary)]/10 rounded-full text-sm text-[var(--primary)] font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            قريباً — النسخة التجريبية
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] mb-3">
            سوق داسم
          </h1>
          <p className="text-lg text-[var(--foreground)]/70 max-w-2xl mx-auto">
            وجهتك المفتوحة للإعلانات — معارض سيارات، عقار، أجهزة، مزادات حيّة،
            ومحادثة مدمجة مع البائع مباشرة.
          </p>
        </div>
      </header>

      {/* Sections preview */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Store className="w-6 h-6 text-[var(--primary)]" />
          أقسام السوق
        </h2>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 p-4 text-sm">
            تعذّر تحميل الأقسام: {error}
          </div>
        )}

        {!error && sections.length === 0 && (
          <p className="text-[var(--foreground)]/60 text-sm">
            لا توجد أقسام مفعّلة حالياً. فعّلها من لوحة الأدمن.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sections.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-3">{s.icon ?? "📦"}</div>
              <h3 className="font-bold text-lg mb-1">{s.name_ar}</h3>
              <p className="text-xs text-[var(--foreground)]/50 font-mono">{s.slug}</p>
              {s.children && s.children.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.children.slice(0, 4).map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--foreground)]/70"
                    >
                      {tag.name_ar}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-12 py-6 text-center text-sm text-[var(--foreground)]/50">
        <p>© {new Date().getFullYear()} سوق داسم · جزء من منظومة DASM</p>
      </footer>
    </main>
  );
}
