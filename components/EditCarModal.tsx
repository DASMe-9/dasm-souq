"use client";

/**
 * EditCarModal — souq-native edit form for a Core car.
 *
 * Reads + writes directly to api.dasm.com.sa (Bearer):
 *   • mount  → GET  /cars/{id}     (prefill fields)
 *   • save   → PUT  /cars/{id}     (write back)
 *
 * The edit happens INSIDE souq.dasm.com.sa — no navigation to www. The
 * canonical car form on dasm.com.sa is unchanged; this is a slim edit
 * surface designed for the common case (update price, add/remove photos,
 * fill in fields auctions require).
 *
 * After save, parent triggers a /me reload so badges + price reflect the
 * change everywhere instantly.
 */

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  X,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "https://api.dasm.com.sa/api";

interface Props {
  carId: number;
  onClose: () => void;
  onSaved?: () => void;
}

interface CarShape {
  id: number;
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  vin?: string | null;
  plate?: string | null;
  odometer?: number | string | null;
  color?: string | null;
  engine?: string | null;
  transmission?: string | null;
  condition?: string | null;
  description?: string | null;
  city?: string | null;
  fixed_price?: number | string | null;
  min_price?: number | string | null;
  max_price?: number | string | null;
  image?: string[] | string | null;
  images_list?: string[];
}

const TRANSMISSIONS: { value: string; label: string }[] = [
  { value: "automatic", label: "أوتوماتيك" },
  { value: "manual", label: "عادي (مانيوال)" },
  { value: "cvt", label: "CVT" },
];

const CONDITIONS: { value: string; label: string }[] = [
  { value: "new", label: "جديد" },
  { value: "excellent", label: "ممتاز" },
  { value: "good", label: "جيد" },
  { value: "fair", label: "مقبول" },
  { value: "poor", label: "يحتاج إصلاح" },
];

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

export default function EditCarModal({ carId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable fields
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [vin, setVin] = useState("");
  const [plate, setPlate] = useState("");
  const [odometer, setOdometer] = useState<string>("");
  const [color, setColor] = useState("");
  const [engine, setEngine] = useState("");
  const [transmission, setTransmission] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [fixedPrice, setFixedPrice] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Load car
  useEffect(() => {
    const token = readToken();
    if (!token) {
      setLoadError("جلستك انتهت — أعد تسجيل الدخول");
      setLoading(false);
      return;
    }
    fetch(`${CORE_API_URL}/cars/${carId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((body) => {
        // Endpoint returns either `data.car` or `data` directly. Accept both.
        const car: CarShape =
          body?.data?.car ?? body?.data ?? body?.car ?? body;
        if (!car || typeof car !== "object") {
          throw new Error("استجابة غير متوقعة");
        }
        setMake(car.make ?? "");
        setModel(car.model ?? "");
        setYear(car.year != null ? String(car.year) : "");
        setVin(car.vin ?? "");
        setPlate(car.plate ?? "");
        setOdometer(car.odometer != null ? String(car.odometer) : "");
        setColor(car.color ?? "");
        setEngine(car.engine ?? "");
        setTransmission(car.transmission ?? "");
        setCondition(car.condition ?? "");
        setDescription(car.description ?? "");
        setCity(car.city ?? "");
        setFixedPrice(car.fixed_price != null ? String(car.fixed_price) : "");
        setMinPrice(car.min_price != null ? String(car.min_price) : "");
        setMaxPrice(car.max_price != null ? String(car.max_price) : "");
        const imgs = Array.isArray(car.images_list)
          ? car.images_list
          : Array.isArray(car.image)
            ? (car.image as string[])
            : [];
        setImageUrls(imgs.filter((u) => typeof u === "string" && u.length > 0));
        setLoading(false);
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "تعذّر التحميل");
        setLoading(false);
      });
  }, [carId]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const token = readToken();
    if (!token) {
      setSaveError("جلستك انتهت — أعد تسجيل الدخول");
      setSaving(false);
      return;
    }

    // Build PATCH-style payload — only send fields that are non-empty so we
    // never overwrite real data with empty strings on accident.
    const payload: Record<string, unknown> = {};
    if (make.trim()) payload.make = make.trim();
    if (model.trim()) payload.model = model.trim();
    if (year && /^\d{4}$/.test(year.trim())) payload.year = parseInt(year, 10);
    if (vin.trim()) payload.vin = vin.trim();
    if (plate.trim()) payload.plate = plate.trim();
    if (odometer && /^\d+$/.test(odometer.trim()))
      payload.odometer = parseInt(odometer, 10);
    if (color.trim()) payload.color = color.trim();
    if (engine.trim()) payload.engine = engine.trim();
    if (transmission) payload.transmission = transmission;
    if (condition) payload.condition = condition;
    if (description.trim()) payload.description = description.trim();
    if (city.trim()) payload.city = city.trim();
    if (fixedPrice && parseFloat(fixedPrice) > 0)
      payload.fixed_price = parseFloat(fixedPrice);
    if (minPrice && parseFloat(minPrice) > 0)
      payload.min_price = parseFloat(minPrice);
    if (maxPrice && parseFloat(maxPrice) > 0)
      payload.max_price = parseFloat(maxPrice);
    if (imageUrls.length > 0) payload.image = imageUrls;

    try {
      const res = await fetch(`${CORE_API_URL}/cars/${carId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.status === "error") {
        const firstErr =
          data?.errors && Object.values(data.errors)[0];
        const msg =
          (Array.isArray(firstErr) && firstErr[0]) ||
          data?.message ||
          `تعذّر الحفظ (HTTP ${res.status})`;
        throw new Error(msg);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] rounded-t-2xl">
          <h2 className="text-base font-extrabold text-[var(--fg)]">
            تعديل بيانات السيارة
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 rounded-lg hover:bg-[var(--bg-muted)]"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-[var(--fg-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[var(--fg-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-600)]" />
              <span className="text-sm">جارٍ تحميل بيانات السيارة...</span>
            </div>
          ) : loadError ? (
            <div className="py-12 flex flex-col items-center gap-2 text-red-700">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm font-semibold">{loadError}</span>
            </div>
          ) : (
            <>
              {/* Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="الماركة">
                  <input
                    className="input"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="تويوتا"
                  />
                </Field>
                <Field label="الموديل">
                  <input
                    className="input"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="كامري"
                  />
                </Field>
                <Field label="السنة">
                  <input
                    className="input tabular-nums"
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                  />
                </Field>
              </div>

              {/* Identity 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="رقم الهيكل (VIN)">
                  <input
                    className="input"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="17 خانة"
                    maxLength={17}
                  />
                </Field>
                <Field label="رقم اللوحة">
                  <input
                    className="input"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="مثال: أ ب ج 1234"
                  />
                </Field>
              </div>

              {/* Tech */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="عدد الكيلومترات">
                  <input
                    className="input tabular-nums"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="35000"
                  />
                </Field>
                <Field label="اللون">
                  <input
                    className="input"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="أبيض لؤلؤي"
                  />
                </Field>
                <Field label="المحرك">
                  <input
                    className="input"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="مثلاً: 2.5L"
                  />
                </Field>
              </div>

              {/* Tech 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="ناقل الحركة">
                  <select
                    className="input"
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                  >
                    <option value="">— اختر —</option>
                    {TRANSMISSIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="حالة السيارة">
                  <select
                    className="input"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="">— اختر —</option>
                    {CONDITIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="المدينة">
                  <input
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="الرياض"
                  />
                </Field>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[var(--border-soft)] pt-4">
                <Field label="السعر الثابت (ر.س)">
                  <input
                    className="input tabular-nums"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    placeholder="85000"
                  />
                </Field>
                <Field label="حد أدنى للمزاد">
                  <input
                    className="input tabular-nums"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="50000"
                  />
                </Field>
                <Field label="حد أعلى للمزاد">
                  <input
                    className="input tabular-nums"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="80000"
                  />
                </Field>
              </div>

              {/* Description */}
              <Field label="وصف السيارة">
                <textarea
                  className="input resize-y"
                  rows={4}
                  maxLength={5000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اذكر الحالة، الملكية، الضمان، أي تفاصيل..."
                />
              </Field>

              {/* Images */}
              <div className="border-t border-[var(--border-soft)] pt-4">
                <label className="block text-sm font-bold mb-2">
                  <ImageIcon className="inline w-4 h-4 ml-1 -mt-0.5" />
                  صور السيارة
                </label>
                <ImageUploader
                  urls={imageUrls}
                  onChange={setImageUrls}
                  maxFiles={10}
                  disabled={saving}
                />
              </div>

              {saveError && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-red-300 bg-red-50 text-red-900 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !loadError && (
          <div className="flex gap-3 px-5 py-4 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-card)] rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 h-11 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm font-semibold disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          display: block;
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--fg);
          font-family: inherit;
          font-size: 14px;
        }
        textarea.input {
          height: auto;
          min-height: 96px;
          padding: 10px 12px;
          line-height: 1.6;
        }
        .input:focus {
          outline: none;
          border-color: var(--brand-500);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 text-[var(--fg)]">
        {label}
      </label>
      {children}
    </div>
  );
}
