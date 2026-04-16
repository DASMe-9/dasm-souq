import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--bg-muted)] grid place-items-center">
          <PackageX className="w-10 h-10 text-[var(--fg-soft)]" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2">الإعلان غير متاح</h1>
        <p className="text-sm text-[var(--fg-muted)] mb-6">
          الإعلان الذي تبحث عنه قد يكون حُذف أو أُوقف أو لم يُفعَّل بعد.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold transition"
        >
          العودة للصفحة الرئيسية
        </a>
      </main>
      <Footer />
    </>
  );
}
