import { redirect } from "next/navigation";
import { getAuthenticatedUser, fetchCoreSections, fetchCoreRegions } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublishForm from "@/components/PublishForm";

export const metadata = { title: "أضف إعلانك — سوق داسم" };
export const dynamic = "force-dynamic";

export default async function PublishPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    // Keep the user inside سوق داسم — no bounce to the parent domain.
    // The Sanctum session cookie is shared across `.dasm.com.sa`, so after
    // they log in here they're signed in everywhere in منظومة داسم.
    redirect("/auth/login?returnUrl=/publish");
  }

  const [sections, regions] = await Promise.all([
    fetchCoreSections(),
    fetchCoreRegions(),
  ]);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">أضف إعلانك</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            أهلاً {user.name ?? "بك"} — املأ التفاصيل وإعلانك سيظهر فوراً في سوق داسم.
          </p>
        </div>
        <PublishForm
          sections={sections}
          regions={regions}
          userName={user.name ?? ""}
        />
      </main>
      <Footer />
    </>
  );
}
