import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { fetchUserGarage } from "@/lib/garage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GarageView from "@/components/GarageView";

export const metadata = { title: "مساحتي — سوق داسم" };
export const dynamic = "force-dynamic";

export default async function MyGaragePage() {
  // Auth gate (mirrors /publish behaviour).
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?returnUrl=/me");
  }

  const garage = await fetchUserGarage();

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
            مساحتي
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">
            أهلاً {user.name ?? "بك"} — هنا كل سياراتك وما تفعل بكل واحدة منها.
          </p>
        </div>

        <GarageView garage={garage} userName={user.name ?? ""} />
      </main>
      <Footer />
    </>
  );
}
