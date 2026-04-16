"use client";

import { useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { loginWithPassword } from "@/lib/auth-client";

export default function LoginForm({ returnUrl }: { returnUrl: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const result = await loginWithPassword(email.trim(), password);

    if (result.success) {
      // Hard-navigate to make absolutely sure the server-side auth bridge
      // sees the freshly-set .dasm.com.sa session cookie + our dasm_token
      // cookie. `router.push` + `router.refresh` sometimes hits a stale RSC
      // cache on Next.js 16 and bounces the user back to /auth/login,
      // which looks like "the button does nothing" to the user.
      if (typeof window !== "undefined") {
        window.location.replace(returnUrl || "/");
      }
      return;
    }

    setError(result.error || "فشل تسجيل الدخول");
    setLoading(false);
    // Scroll the error into view on small screens, where the alert can
    // otherwise sit above the keyboard and be missed entirely.
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] items-center justify-center shadow-md mb-3">
          <span className="text-white font-extrabold text-2xl">د</span>
        </div>
        <h1 className="text-2xl font-extrabold mb-1">دخول سوق داسم</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          سجل دخولك لإضافة إعلاناتك ومتابعة محادثاتك.
        </p>
      </div>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          aria-live="polite"
          className="mb-4 flex gap-2 items-start p-3 rounded-xl border border-red-300 bg-red-50 text-red-900 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-semibold mb-1.5"
          >
            البريد الإلكتروني
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mail@example.com"
            className="w-full h-11 px-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-500)] transition"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-semibold mb-1.5"
          >
            كلمة المرور
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3 pr-3 pl-10 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-500)] transition"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
        >
          <LogIn className="w-4 h-4" />
          {loading ? "جارٍ الدخول..." : "سجل دخولك"}
        </button>
      </form>

      <div className="mt-6 text-sm text-center text-[var(--fg-muted)] space-y-2">
        <a
          href="https://www.dasm.com.sa/auth/forgot-password"
          className="hover:text-[var(--brand-700)] hover:underline block"
        >
          هل نسيت كلمة المرور؟
        </a>
        <div>
          ما عندك حساب؟{" "}
          <a
            href={`/auth/register${
              returnUrl && returnUrl !== "/"
                ? `?returnUrl=${encodeURIComponent(returnUrl)}`
                : ""
            }`}
            className="font-bold text-[var(--brand-700)] hover:underline"
          >
            أنشئ حسابك الآن
          </a>
        </div>
      </div>
    </div>
  );
}
