"use client";

/**
 * DecideDestinationModal — souq-native version.
 *
 * Pops up INSIDE souq (no navigation to dasm.com.sa). Same conceptual
 * design as the canonical DecideListingModal in DASM-Platform but:
 *   - lives entirely on souq.dasm.com.sa
 *   - posts directly to api.dasm.com.sa (Sanctum Bearer + CORS already wired)
 *   - reuses the user's session token from localStorage
 *
 * Two product paths today:
 *   • Cars (Core entity)         → POST api.dasm.com.sa/api/cars/{id}/publish/{auction|market}
 *   • Non-car listings (Services) → not handled here; non-car cards have
 *     their own simpler [نشر/إيقاف/حذف] inline actions.
 */

import { useEffect, useState } from "react";
import {
  Gavel,
  Store,
  Clock,
  CalendarDays,
  Zap,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "https://api.dasm.com.sa/api";

type ListingType = "auction" | "classified";
type Step = "choose" | "details" | "success";
type StartMode = "immediate" | "scheduled";

interface PrefillPrices {
  min_price?: string | number | null;
  max_price?: string | number | null;
  fixed_price?: string | number | null;
}

interface Props {
  carId: number;
  carLabel: string;
  prefillPrices?: PrefillPrices;
  onClose: () => void;
  onSuccess?: (which: ListingType) => void;
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLs = localStorage.getItem("dasm_token");
    if (fromLs) return fromLs;
  } catch {
    /* ignore */
  }
  try {
    const m = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("dasm_token="));
    if (m) return decodeURIComponent(m.slice("dasm_token=".length));
  } catch {
    /* ignore */
  }
  return null;
}

const cleanZero = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (s === "" || parseFloat(s) === 0) return "";
  return s;
};

export default function DecideDestinationModal({
  carId,
  carLabel,
  prefillPrices,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [listingType, setListingType] = useState<ListingType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auction fields
  const [duration, setDuration] = useState("10");
  const [startMode, setStartMode] = useState<StartMode>("immediate");
  const [startDate, setStartDate] = useState("");
  const [minPrice, setMinPrice] = useState(cleanZero(prefillPrices?.min_price));
  const [maxPrice, setMaxPrice] = useState(cleanZero(prefillPrices?.max_price));
  const [openingPrice, setOpeningPrice] = useState("");
  const [minAllowed, setMinAllowed] = useState<number | null>(null);
  const [maxAllowed, setMaxAllowed] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Market field
  const [fixedPrice, setFixedPrice] = useState(cleanZero(prefillPrices?.fixed_price));

  // Auto-bound opening price like the source modal
  useEffect(() => {
    const minVal = parseFloat(minPrice);
    if (!isNaN(minVal) && minVal > 0) {
      const calcMin = Math.ceil((minVal * 0.5) / 100) * 100;
      const calcMax = Math.floor((minVal * 0.85) / 100) * 100;
      setMinAllowed(calcMin);
      setMaxAllowed(calcMax);
      if (!openingPrice || parseFloat(openingPrice) === 0) {
        setOpeningPrice(String(calcMin));
      }
    } else {
      setMinAllowed(null);
      setMaxAllowed(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice]);

  useEffect(() => {
    if (minAllowed !== null && maxAllowed !== null && openingPrice) {
      const p = parseFloat(openingPrice);
      if (p < minAllowed)
        setPriceError(`سعر الافتتاح أقل من الحد المسموح (${minAllowed.toLocaleString()})`);
      else if (p > maxAllowed)
        setPriceError(`سعر الافتتاح أكبر من الحد المسموح (${maxAllowed.toLocaleString()})`);
      else setPriceError(null);
    } else {
      setPriceError(null);
    }
  }, [openingPrice, minAllowed, maxAllowed]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function postToCore(path: string, body: Record<string, unknown>) {
    const token = readToken();
    if (!token) throw new Error("جلستك انتهت — أعد تسجيل الدخول");
    const res = await fetch(`${CORE_API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.status === "error") {
      throw new Error(data?.message || "تعذّر تنفيذ الطلب");
    }
    return data;
  }

  async function publishToMarket() {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (fixedPrice) body.fixed_price = parseFloat(fixedPrice);
      await postToCore(`/cars/${carId}/publish/market`, body);
      setStep("success");
      onSuccess?.("classified");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر النشر");
    } finally {
      setSubmitting(false);
    }
  }

  async function publishToAuction() {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        main_auction_duration: parseInt(duration),
        start_immediately: startMode === "immediate",
      };
      if (startMode === "scheduled" && startDate) {
        body.auction_start_date = startDate;
      }
      if (minPrice) body.min_price = parseFloat(minPrice);
      if (maxPrice) body.max_price = parseFloat(maxPrice);
      if (openingPrice) body.starting_price = parseFloat(openingPrice);
      await postToCore(`/cars/${carId}/publish/auction`, body);
      setStep("success");
      onSuccess?.("auction");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر النشر");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && step !== "success" && onClose()}
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-extrabold text-[var(--fg)]">
            {step === "choose" && "اختر وجهة سيارتك"}
            {step === "details" &&
              (listingType === "auction" ? "إعدادات المزاد" : "إعدادات الإعلان")}
            {step === "success" && "تم بنجاح!"}
          </h2>
          {step !== "success" && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--bg-muted)]"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 text-[var(--fg-muted)]" />
            </button>
          )}
        </div>

        {/* Step: choose */}
        {step === "choose" && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-[var(--fg-muted)] mb-2">
              اختر وجهة سيارتك <b className="text-[var(--fg)]">{carLabel}</b> للنشر:
            </p>

            <button
              onClick={() => {
                setListingType("auction");
                setStep("details");
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border)] hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)] transition-all text-right"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-100)] grid place-items-center shrink-0">
                <Gavel className="w-6 h-6 text-[var(--brand-700)]" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[var(--fg)]">المزاد</div>
                <div className="text-xs text-[var(--fg-muted)] mt-0.5">
                  ادخل سيارتك في مزاد بمدة وتاريخ بدء تحدّدهما أنت.
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setListingType("classified");
                setStep("details");
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border)] hover:border-emerald-500 hover:bg-emerald-50 transition-all text-right"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 grid place-items-center shrink-0">
                <Store className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[var(--fg)]">سوق داسم</div>
                <div className="text-xs text-[var(--fg-muted)] mt-0.5">
                  اعرض سيارتك بسعر ثابت في سوق داسم — منصة الإعلانات المبوّبة.
                </div>
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full text-center text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] py-2"
            >
              أقرّر لاحقاً — تبقى السيارة في مساحتي
            </button>
          </div>
        )}

        {/* Step: auction */}
        {step === "details" && listingType === "auction" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">الحد الأدنى</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="مثال: 50000"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand-500)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">الحد الأعلى</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="مثال: 80000"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand-500)]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5">سعر الافتتاح</label>
                <input
                  type="number"
                  min={0}
                  value={openingPrice}
                  onChange={(e) => setOpeningPrice(e.target.value)}
                  placeholder="يبدأ المزاد من هذا السعر"
                  className={`w-full bg-[var(--bg)] border rounded-xl px-3 py-2 text-sm focus:outline-none ${priceError ? "border-red-500" : "border-[var(--border)] focus:border-[var(--brand-500)]"}`}
                />
                {minAllowed && maxAllowed && (
                  <p className="text-[10px] mt-1 text-[var(--fg-muted)]">
                    المسموح بين {minAllowed.toLocaleString()} و {maxAllowed.toLocaleString()} ريال.
                  </p>
                )}
                {priceError && (
                  <p className="text-[10px] mt-0.5 text-red-500 font-medium">{priceError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                <Clock className="w-4 h-4 text-[var(--brand-700)]" />
                مدة المزاد
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "10", l: "10 أيام" },
                  { v: "20", l: "20 يوم" },
                  { v: "30", l: "30 يوم" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setDuration(o.v)}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      duration === o.v
                        ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                        : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--brand-300)]"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                <CalendarDays className="w-4 h-4 text-[var(--brand-700)]" />
                وقت البدء
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStartMode("immediate")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold ${
                    startMode === "immediate"
                      ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--brand-300)]"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  فوراً
                </button>
                <button
                  type="button"
                  onClick={() => setStartMode("scheduled")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold ${
                    startMode === "scheduled"
                      ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--brand-300)]"
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  تاريخ محدد
                </button>
              </div>
              {startMode === "scheduled" && (
                <input
                  type="date"
                  min={minDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-500)]"
                />
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-red-300 bg-red-50 text-red-900 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setStep("choose");
                  setListingType(null);
                  setError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm"
              >
                رجوع
              </button>
              <button
                onClick={publishToAuction}
                disabled={
                  submitting ||
                  (startMode === "scheduled" && !startDate) ||
                  !minPrice ||
                  !maxPrice ||
                  !!priceError
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
                {submitting ? "جاري النشر..." : "تأكيد — أدخل المزاد"}
              </button>
            </div>
          </div>
        )}

        {/* Step: classified */}
        {step === "details" && listingType === "classified" && (
          <div className="p-5 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                <Store className="w-4 h-4 text-emerald-600" />
                سعر البيع الثابت (ريال)
              </label>
              <input
                type="number"
                min={0}
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                placeholder="أدخل سعر البيع"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
              />
              {fixedPrice && (
                <p className="text-xs text-[var(--fg-muted)] mt-1">
                  {parseInt(fixedPrice).toLocaleString("en-US")} ريال
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-red-300 bg-red-50 text-red-900 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setStep("choose");
                  setListingType(null);
                  setError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm"
              >
                رجوع
              </button>
              <button
                onClick={publishToMarket}
                disabled={submitting || !fixedPrice}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                {submitting ? "جاري النشر..." : "تأكيد — أعلن في سوق داسم"}
              </button>
            </div>
          </div>
        )}

        {/* Step: success */}
        {step === "success" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 grid place-items-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-base font-extrabold text-[var(--fg)]">
              {listingType === "auction"
                ? "تم تسجيل سيارتك في المزادات!"
                : "تم نشر إعلانك في سوق داسم!"}
            </h3>
            <p className="text-sm text-[var(--fg-muted)]">
              {listingType === "auction"
                ? "ستظهر السيارة في صفحات المزاد، وسيستلم المزايدون إشعار البدء."
                : "بطاقة سيارتك صارت معروضة في سوق داسم — يمكن للمشترين التواصل معك مباشرة."}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm"
            >
              تم
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
