import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginForm from "./Form";

export const metadata = { title: "تسجيل الدخول — سوق داسم" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ returnUrl?: string }>;
}

function safeReturnUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  // Only allow relative URLs that stay inside souq.
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

export default async function LoginPage({ searchParams }: Props) {
  const { returnUrl } = await searchParams;
  const safe = safeReturnUrl(returnUrl) || "/";

  const user = await getAuthenticatedUser();
  if (user) {
    redirect(safe);
  }

  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <LoginForm returnUrl={safe} />
      </main>
      <Footer />
    </>
  );
}
