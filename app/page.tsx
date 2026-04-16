import { fetchSections } from "@/lib/api";
import Header from "@/components/Header";
import CategoriesGrid from "@/components/CategoriesGrid";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";

// <Hero /> and <TrustBar /> were removed from the home page on
// 2026-04-16 per owner request. The hero was a marketing banner
// ("سوقك المفتوح في سوق داسم" + 4 feature cards + two CTAs) and the
// trust bar was a quick stats row (4.8/5, 13 areas, 50K sellers,
// 10K listings). Both sat ABOVE the actual content ("تصفّح حسب
// القسم") and pushed it below the fold. The home page now lands
// straight into categories. The components themselves are kept in
// components/ for potential future reuse on a marketing page.

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
    <>
      <Header />
      <main>
        <CategoriesGrid sections={sections} error={error} />
        <FeaturedListings />
      </main>
      <Footer />
    </>
  );
}
