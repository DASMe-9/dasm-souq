import { redirect } from "next/navigation";
import {
  getAuthenticatedUser,
  fetchCoreSections,
  fetchCoreRegions,
} from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublishForm from "@/components/PublishForm";
import PublishCategoryPicker from "@/components/PublishCategoryPicker";

export const metadata = { title: "أضف إعلانك — سوق داسم" };
export const dynamic = "force-dynamic";

/**
 * Two modes:
 *   /publish           → Haraj-style category picker (pick what you're listing)
 *   /publish?type=<slug> → the existing PublishForm, section pre-selected
 *
 * Owner-requested 2026-04-16. Keeps a single URL surface; no two-page flow.
 */
export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?returnUrl=/publish");
  }

  const [sections, regions] = await Promise.all([
    fetchCoreSections(),
    fetchCoreRegions(),
  ]);

  const raw = await searchParams;
  const typeParam = Array.isArray(raw.type) ? raw.type[0] : raw.type;
  const preSelected = typeParam
    ? sections.find((s) => s.slug === typeParam && s.is_active)
    : undefined;

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {preSelected ? (
          <>
            <div className="mb-6">
              <a
                href="/publish"
                className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--brand-700)] mb-3"
              >
                ← اختر نوع إعلان آخر
              </a>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
                أضف إعلانك
              </h1>
              <p className="text-sm text-[var(--fg-muted)]">
                أهلاً {user.name ?? "بك"} — {preSelected.name_ar}، املأ التفاصيل
                وإعلانك سيظهر فوراً في سوق داسم.
              </p>
            </div>
            <PublishForm
              sections={sections}
              regions={regions}
              userName={user.name ?? ""}
              initialSectionSlug={preSelected.slug}
            />
          </>
        ) : (
          <PublishCategoryPicker sections={sections} />
        )}
      </main>
      <Footer />
    </>
  );
}
