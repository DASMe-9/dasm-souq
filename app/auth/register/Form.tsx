"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerUser } from "@/lib/auth-client";

export default function RegisterForm({ returnUrl }: { returnUrl: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== passwordConfirm) {
      setError("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }
    setLoading(true);
    setError("");

    const result = await registerUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
      password_confirmation: passwordConfirm,
    });

    if (result.success) {
      // Core may require email verification before login; in that case we
      // still have a "soft success" — show confirmation instead of redirecting.
      if (!result.token) {
        setNeedsVerification(true);
        setLoading(false);
        return;
      }
      router.push(returnUrl);
      router.refresh();
      return;
    }

    setError(result.error || "تعذّر إنشاء الحساب.");
    setLoading(false);
  }

  if (needsVerification) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm p-6 sm:p-8 text-center">
        <CheckCircle2 className="w-14 h-14 mx-auto text-green-600 mb-3" />
        <h2 className="text-xl font-extrabold mb-2">تم إنشاء حسابك</h2>
        <p className="text-sm text-[var(--fg-muted)] mb-4">
          راسلناك برسالة تأكيد على <b dir="ltr">{email}</b>. افتح الرسالة واضغط
          رابط التفعيل ثم ارجع وسجّل دخولك.
        </p>
        <a
          href={`/auth/login${
            returnUrl && returnUrl !== "/"
              ? `?returnUrl=${encodeURIComponent(returnUrl)}`
              : ""
          }`}
          className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm"
        >
          العودة لتسجيل الدخول
        </a>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] items-center justify-center shadow-md mb-3">
          <span className="text-white font-extrabold text-2xl">د</span>
        </div>
        <h1 className="text-2xl font-extrabold mb-1">أنشئ حسابك</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          حسابك في سوق داسم يفتح لك كامل منظومة داسم تلقائياً.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex gap-2 items-start p-3 rounded-xl border border-red-300 bg-red-50 text-red-900 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="reg-name"
            className="block text-sm font-semibold mb-1.5"
          >
            الاسم الكامل
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: محمد عبدالله"
            className="w-full h-11 px-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-500)] transition"
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-sm font-semibold mb-1.5"
          >
            البريد الإلكتروني
          </label>
          <input
            id="reg-email"
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
            htmlFor="reg-phone"
            className="block text-sm font-semibold mb-1.5"
          >
            رقم الجوال <span className="text-[var(--fg-soft)] font-normal">(اختياري)</span>
          </label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+9665XXXXXXXX"
            className="w-full h-11 px-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-500)] transition"
          />
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="block text-sm font-semibold mb-1.5"
          >
            كلمة المرور
          </label>
          <div className="relative">
            <input
              id="reg-password"
              name="new-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="٨ أحرف فأكثر"
              className="w-full h-11 px-3 pr-3 pl-10 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-500)] transition"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              aria-label={showPw ? "إخفاء" : "إظهار"}
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

        <div>
          <label
            htmlFor="reg-password-confirm"
            className="block text-sm font-semibold mb-1.5"
          >
            تأكيد كلمة المرور
          </label>
          <input
            id="reg-password-confirm"
            name="new-password-confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            className="w-full h-11 px-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-500)] transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? "جارٍ الإنشاء..." : "أنشئ حسابك"}
        </button>
      </form>

      <div className="mt-6 text-sm text-center text-[var(--fg-muted)]">
        عندك حساب؟{" "}
        <a
          href={`/auth/login${
            returnUrl && returnUrl !== "/"
              ? `?returnUrl=${encodeURIComponent(returnUrl)}`
              : ""
          }`}
          className="font-bold text-[var(--brand-700)] hover:underline"
        >
          سجّل دخولك
        </a>
      </div>
    </div>
  );
}
