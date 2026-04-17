import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthSessionProvider } from "@/components/AuthSession";
import { getAuthenticatedUser } from "@/lib/auth";

const TALK_WIDGET_URL =
  process.env.NEXT_PUBLIC_TALK_WIDGET_URL ||
  "https://talk.dasm.com.sa/widget.js";

export const metadata: Metadata = {
  title: {
    default: "سوق داسم — وجهتك المفتوحة للإعلانات والمنتجات",
    template: "%s | سوق داسم",
  },
  description:
    "سوق داسم (DASM Souq) — سوق مبوّبات سعودي يجمع معارض السيارات، السيارات المتخصصة، العقار، الأجهزة، والمزيد، مع محادثة مدمجة ومزادات حيّة.",
  keywords: ["سوق داسم", "حراج", "سيارات", "عقار", "مزادات", "السعودية"],
  openGraph: {
    title: "سوق داسم",
    description: "السوق المفتوح للإعلانات — محادثة مدمجة، مزادات، وإجراءات رسمية.",
    url: "https://souq.dasm.com.sa",
    siteName: "سوق داسم",
    locale: "ar_SA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a5c36",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve the authenticated user on the server once so the first paint
  // already knows who's logged in — no flash of signed-out UI.
  const user = await getAuthenticatedUser();

  return (
    <html lang="ar" dir="rtl">
      <head>
        {/*
         * Theme resolver — runs before paint to prevent FOUC (flash of
         * wrong theme). Reads the user's choice from localStorage:
         *   "light" / "dark" → set data-theme explicitly
         *   "system" or absent → leave attribute off; CSS falls back
         *     to prefers-color-scheme.
         * The try/catch covers private mode + disabled storage.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('dasm-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <AuthSessionProvider initialUser={user}>{children}</AuthSessionProvider>
        {/*
         * DASM Talk widget — one unified chat pill across the منظومة.
         * Same cookie domain (.dasm.com.sa) means the widget auto-detects
         * the signed-in user without a separate login.
         */}
        <Script
          src={TALK_WIDGET_URL}
          strategy="afterInteractive"
          data-dasm-source="souq"
        />
      </body>
    </html>
  );
}
