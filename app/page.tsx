import { fetchSections } from "@/lib/api";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import CategoriesGrid from "@/components/CategoriesGrid";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";

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
        <Hero />
        <TrustBar />
        <CategoriesGrid sections={sections} error={error} />
        <FeaturedListings />
      </main>
      <Footer />
    </>
  );
}
