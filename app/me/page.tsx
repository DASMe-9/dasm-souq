import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { fetchUserGarage } from "@/lib/garage";
import { fetchUserListings } from "@/lib/listings-me";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GarageView from "@/components/GarageView";
import MyListingsView from "@/components/MyListingsView";

export const metadata = { title: "مساحتي — سوق داسم" };
export const dynamic = "force-dynamic";

/**
 * مساحتي — two stacked sections:
 *   1. سياراتي          (cars + destinations, /api/me/garage)
 *   2. إعلاناتي الأخرى  (non-car listings, /api/me/listings)
 *
 * Both fetches are independent; fetched in parallel to cut latency.
 * Either can fail softly (returns null) and the partner section
 * still renders normally.
 */
export default async function MyGaragePage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?returnUrl=/me");
  }

  const [garage, listings] = await Promise.all([
    fetchUserGarage(),
    fetchUserListings(),
  ]);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">مساحتي</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            أهلاً {user.name ?? "بك"} — كل ما تملكه وتنشره في سوق داسم.
          </p>
        </div>

        <GarageView garage={garage} userName={user.name ?? ""} />

        <MyListingsView data={listings} />
      </main>
      <Footer />
    </>
  );
}
