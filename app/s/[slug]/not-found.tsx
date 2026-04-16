import { AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Rendered when /s/{slug} is hit for a slug that's not in the active
 * sections list (either typo, disabled by admin, or never seeded).
 */

export default function SectionNotFound() {
  return (
    <>
      <Header />
      <main
        className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center"
        dir="rtl"
      >
        <div className="inline-flex w-16 h-16 rounded-2xl bg-[var(--brand-50)] items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-[var(--brand-600)]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
          لم نجد هذا القسم
        </h1>
        <p className="text-sm text-[var(--fg-muted)] mb-6 max-w-md mx-auto">
          القسم الذي تبحث عنه غير مفعّل حالياً أو غير موجود. جرّب الرجوع إلى
          الصفحة الرئيسية واختيار قسم مفعّل من قائمة الأقسام.
        </p>
        <div className="flex items-center justify-center gap-2">
          <a
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md transition"
          >
            الرئيسية
          </a>
          <a
            href="/listings"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--fg)] font-bold text-sm transition"
          >
            كل الإعلانات
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
