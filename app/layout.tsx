import type { Metadata, Viewport } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
