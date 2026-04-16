"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Check,
  Loader2,
  Gavel,
  AlertTriangle,
  Eye,
  Save,
  Sparkles,
  X,
  Car,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

interface Section {
  id: number;
  slug: string;
  name_ar: string;
  icon: string | null;
}

interface Region {
  id: number;
  code: string;
  name: string;
}

interface Props {
  sections: Section[];
  regions: Region[];
  userName: string;
}

const MAX_IMAGES = 10;
const STORAGE_KEY = "souq:lastPublishDraft";

// Sections that use the vehicle-details block. Add slugs here as we enable
// more car-family sections in the admin.
const VEHICLE_SECTIONS = new Set(["showrooms", "specialized-cars"]);

const CONDITION_OPTIONS = [
  { value: "new", label: "جديد — لم يُستخدم" },
  { value: "like_new", label: "كالجديد — استخدام خفيف" },
  { value: "used", label: "مستعمل — بحالة جيدة" },
  { value: "for_parts", label: "لقطع الغيار / يحتاج إصلاح" },
] as const;

type ConditionValue = (typeof CONDITION_OPTIONS)[number]["value"];

const TRANSMISSION_OPTIONS = [
  { value: "automatic", label: "أوتوماتيك" },
  { value: "manual", label: "عادي (مانيوال)" },
  { value: "cvt", label: "CVT" },
] as const;

const FUEL_OPTIONS = [
  { value: "gasoline", label: "بنزين" },
  { value: "diesel", label: "ديزل" },
  { value: "hybrid", label: "هجين" },
  { value: "electric", label: "كهربائي" },
] as const;

interface VehicleDetails {
  year?: string;
  kilometers?: string;
  transmission?: string;
  fuel_type?: string;
  color?: string;
}

interface StoredDraft {
  sectionId: number | "";
  title: string;
  description: string;
  price: string;
  isNegotiable: boolean;
  areaCode: string;
  city: string;
  imageUrls: string[];
  isAuctionable: boolean;
  condition: ConditionValue | "";
  vehicle: VehicleDetails;
  savedAt: string;
}

export default function PublishForm({ sections, regions, userName }: Props) {
  const router = useRouter();

  const [sectionId, setSectionId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [areaCode, setAreaCode] = useState<string>("");
  const [city, setCity] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isAuctionable, setIsAuctionable] = useState(false);
  const [condition, setCondition] = useState<ConditionValue | "">("");
  const [vehicle, setVehicle] = useState<VehicleDetails>({});

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  const selectedSection = sections.find((s) => s.id === sectionId);
  const region = regions.find((r) => r.code === areaCode);
  const isVehicleSection =
    !!selectedSection && VEHICLE_SECTIONS.has(selectedSection.slug);

  // Cars (and specialized vehicles) live in Core's `cars` table — that is the
  // source of truth the dashboard, the auctions engine, and every other DASM
  // surface read from. Souq must not create a parallel "car" record. Instead
  // we send the seller to the canonical add-car form on dasm.com.sa, then the
  // dashboard becomes the place to decide: publish as listing / push to
  // auction / both. This keeps a single source of truth and matches the
  // ecosystem map (Core owns the entity, Services owns the display card).
  const CORE_ADD_CAR_URL = "https://www.dasm.com.sa/dashboard/add-car";

  // ─── Remember-last: load on mount ────────────────────────────────
  const hasLoadedStorage = useRef(false);
  useEffect(() => {
    if (hasLoadedStorage.current) return;
    hasLoadedStorage.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as Partial<StoredDraft>;
      // Only offer the banner if there's something substantive to resume.
      if (
        (stored.title && stored.title.trim()) ||
        (stored.description && stored.description.trim()) ||
        (Array.isArray(stored.imageUrls) && stored.imageUrls.length > 0)
      ) {
        setShowResumeBanner(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function resumeLast() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<StoredDraft>;
      if (typeof s.sectionId === "number") setSectionId(s.sectionId);
      if (typeof s.title === "string") setTitle(s.title);
      if (typeof s.description === "string") setDescription(s.description);
      if (typeof s.price === "string") setPrice(s.price);
      if (typeof s.isNegotiable === "boolean") setIsNegotiable(s.isNegotiable);
      if (typeof s.areaCode === "string") setAreaCode(s.areaCode);
      if (typeof s.city === "string") setCity(s.city);
      if (Array.isArray(s.imageUrls)) setImageUrls(s.imageUrls);
      if (typeof s.isAuctionable === "boolean") setIsAuctionable(s.isAuctionable);
      if (typeof s.condition === "string")
        setCondition(s.condition as ConditionValue | "");
      if (s.vehicle && typeof s.vehicle === "object") setVehicle(s.vehicle);
    } catch {
      /* ignore */
    }
    setShowResumeBanner(false);
  }

  function dismissResume() {
    setShowResumeBanner(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  // ─── Remember-last: persist on change (lightweight debounce) ──────
  useEffect(() => {
    if (!hasLoadedStorage.current) return;
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        const snapshot: StoredDraft = {
          sectionId,
          title,
          description,
          price,
          isNegotiable,
          areaCode,
          city,
          imageUrls,
          isAuctionable,
          condition,
          vehicle,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    sectionId,
    title,
    description,
    price,
    isNegotiable,
    areaCode,
    city,
    imageUrls,
    isAuctionable,
    condition,
    vehicle,
  ]);

  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  // ─── Build payload shared by publish + draft ─────────────────────
  function buildPayload(status: "active" | "draft") {
    if (!selectedSection) return null;
    const cleanImages = imageUrls.filter((u) => /^https?:\/\/\S+/.test(u));
    const payload: Record<string, unknown> = {
      title: title.trim(),
      section_id: selectedSection.id,
      section_slug: selectedSection.slug,
      description: description.trim() || null,
      price: price ? Number(price) : null,
      is_negotiable: isNegotiable,
      area_code: areaCode || null,
      city: city.trim() || region?.name || null,
      images: cleanImages,
      is_auctionable: isAuctionable,
      condition: condition || null,
      status,
    };
    if (isVehicleSection) {
      payload.vehicle_details = Object.fromEntries(
        Object.entries(vehicle).filter(([, v]) => v != null && v !== ""),
      );
    }
    return payload;
  }

  // ─── Submit: publish ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedSection) {
      setError("اختر القسم");
      return;
    }
    if (!title.trim()) {
      setError("أدخل عنوان الإعلان");
      return;
    }

    const payload = buildPayload("active");
    if (!payload) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.message || "فشل نشر الإعلان");
        setSubmitting(false);
        return;
      }
      clearStorage();
      const id = body?.data?.id;
      if (id) router.push(`/listings/${id}`);
      else router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      setSubmitting(false);
    }
  }

  // ─── Save as draft ───────────────────────────────────────────────
  async function handleSaveDraft() {
    setError(null);
    if (!selectedSection) {
      setError("اختر القسم قبل حفظ المسوّدة");
      return;
    }
    const payload = buildPayload("draft");
    if (!payload) return;

    setSavingDraft(true);
    try {
      const res = await fetch("/api/v1/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.message || "فشل حفظ المسوّدة");
        setSavingDraft(false);
        return;
      }
      clearStorage();
      // Leave the user on /publish so they can come back via /my-drafts later.
      // We show a brief thank-you then reset.
      setSavingDraft(false);
      setError(null);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      setSavingDraft(false);
    }
  }

  // ─── Preview ─────────────────────────────────────────────────────
  function openPreview() {
    setError(null);
    if (!selectedSection) {
      setError("اختر القسم لمشاهدة المعاينة");
      return;
    }
    if (!title.trim()) {
      setError("اكتب عنواناً لمشاهدة المعاينة");
      return;
    }
    setShowPreview(true);
  }

  // Resolve condition label for preview.
  const conditionLabel =
    CONDITION_OPTIONS.find((c) => c.value === condition)?.label ?? null;

  return (
    <>
      {showResumeBanner && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-[var(--brand-200)] bg-[var(--brand-50)] text-sm">
          <Sparkles className="w-4 h-4 text-[var(--brand-700)] shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-[var(--brand-700)]">
              لديك إعلان غير مكتمل
            </div>
            <div className="text-xs text-[var(--fg-muted)]">
              هل تريد استكمال ما بدأته سابقاً؟
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resumeLast}
              className="h-9 px-3 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-xs font-bold"
            >
              نعم، استكمل
            </button>
            <button
              type="button"
              onClick={dismissResume}
              className="h-9 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--bg-muted)]"
            >
              ابدأ من جديد
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-7"
      >
        {/* Section */}
        <Field label="القسم" required>
          <select
            value={sectionId}
            onChange={(e) =>
              setSectionId(e.target.value ? Number(e.target.value) : "")
            }
            className="input"
            required
          >
            <option value="">— اختر —</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name_ar}
              </option>
            ))}
          </select>
        </Field>

        {/* Cars route — entity lives in Core, not in souq.
            When the user picks a car section, hide the souq form entirely
            and show a single clean call-to-action that takes them to the
            canonical add-car page on dasm.com.sa. The dashboard is where
            they later choose: list in souq / push to auction / both. */}
        {isVehicleSection && (
          <CarRedirectCard
            sectionName={selectedSection?.name_ar ?? "السيارات"}
            url={CORE_ADD_CAR_URL}
          />
        )}

        {!isVehicleSection && (
          <>
        {/* Title */}
        <Field label="عنوان الإعلان" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تويوتا كامري 2024 — حالة ممتازة"
            maxLength={200}
            className="input"
            required
          />
          <p className="text-xs text-[var(--fg-soft)]">
            {title.length}/200 — اكتب عنواناً واضحاً يصف المنتج بدقة.
          </p>
        </Field>

        {/* Condition */}
        <Field label="حالة المنتج">
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as ConditionValue | "")}
            className="input"
          >
            <option value="">— غير محدَّد —</option>
            {CONDITION_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Vehicle-only block */}
        {isVehicleSection && (
          <div className="space-y-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/50">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--fg)]">
              <Car className="w-4 h-4 text-[var(--brand-700)]" />
              تفاصيل المركبة
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="سنة الصنع">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  value={vehicle.year ?? ""}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, year: e.target.value })
                  }
                  placeholder="2024"
                  className="input tabular-nums"
                />
              </Field>
              <Field label="الممشى (كم)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={vehicle.kilometers ?? ""}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, kilometers: e.target.value })
                  }
                  placeholder="35000"
                  className="input tabular-nums"
                />
              </Field>
              <Field label="اللون">
                <input
                  type="text"
                  value={vehicle.color ?? ""}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, color: e.target.value })
                  }
                  placeholder="أبيض لؤلؤي"
                  className="input"
                />
              </Field>
              <Field label="ناقل الحركة">
                <select
                  value={vehicle.transmission ?? ""}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, transmission: e.target.value })
                  }
                  className="input"
                >
                  <option value="">—</option>
                  {TRANSMISSION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="نوع الوقود">
                <select
                  value={vehicle.fuel_type ?? ""}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, fuel_type: e.target.value })
                  }
                  className="input"
                >
                  <option value="">—</option>
                  {FUEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Description */}
        <Field label="الوصف">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="اذكر الحالة، الملكية، الضمان، أي تفاصيل تهم المشتري..."
            className="input resize-y"
          />
        </Field>

        {/* Price row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="السعر (ر.س)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="مثلاً 85000"
              className="input tabular-nums"
            />
          </Field>
          <Field label="قابل للتفاوض">
            <label className="flex items-center gap-2 h-11">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="w-4 h-4 accent-[var(--brand-600)]"
              />
              <span className="text-sm">نعم — المشتري يستطيع التفاوض</span>
            </label>
          </Field>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="المنطقة">
            <select
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              className="input"
            >
              <option value="">— اختر المنطقة —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المدينة / الحي">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="مثال: الرياض — حي العليا"
              className="input"
            />
          </Field>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-bold mb-2">
            <ImageIcon className="inline w-4 h-4 ml-1 -mt-0.5" />
            صور الإعلان
          </label>
          <ImageUploader
            urls={imageUrls}
            onChange={setImageUrls}
            maxFiles={MAX_IMAGES}
            disabled={submitting || savingDraft}
          />
          <p className="text-xs text-[var(--fg-soft)] mt-2">
            الصور تُرفع مباشرة وتُحفظ على Cloudinary. أول صورة هي الغلاف الذي يراه المشتري أولاً.
          </p>
        </div>

        {/* Auction toggle */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--accent-orange)]/5 border border-[var(--accent-orange)]/20 cursor-pointer">
          <input
            type="checkbox"
            checked={isAuctionable}
            onChange={(e) => setIsAuctionable(e.target.checked)}
            className="w-4 h-4 accent-[var(--accent-orange)] mt-1"
          />
          <div className="text-sm">
            <div className="font-bold flex items-center gap-1.5">
              <Gavel className="w-4 h-4 text-[var(--accent-orange)]" />
              أتح المزايدة على هذا الإعلان
            </div>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              سيظهر زر "قدّم مزايدة" بجانب زر المحادثة، والمشترون يستطيعون تقديم عروضهم مباشرة.
            </p>
          </div>
        </label>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-soft)]">
          <button
            type="submit"
            disabled={submitting || savingDraft}
            className="inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold shadow-md transition disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري النشر...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                نشر الإعلان في سوق داسم
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={openPreview}
              disabled={submitting || savingDraft}
              className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-muted)] text-sm font-semibold transition disabled:opacity-60"
            >
              <Eye className="w-4 h-4" />
              معاينة
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || savingDraft}
              className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-muted)] text-sm font-semibold transition disabled:opacity-60"
            >
              {savingDraft ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {savingDraft ? "جارٍ الحفظ..." : "احفظ كمسوّدة"}
            </button>
          </div>

          <a
            href="/"
            className="inline-flex items-center justify-center h-10 text-xs font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            إلغاء والرجوع للرئيسية
          </a>
        </div>
          </>
        )}

        <style jsx>{`
          .input {
            display: block;
            width: 100%;
            height: 44px;
            padding: 0 12px;
            border-radius: 12px;
            border: 1px solid var(--border);
            background: var(--bg);
            color: var(--fg);
            font-family: inherit;
            font-size: 14px;
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          textarea.input {
            height: auto;
            min-height: 120px;
            padding: 10px 12px;
            line-height: 1.6;
          }
          .input:focus {
            outline: none;
            border-color: var(--brand-500);
            box-shadow: var(--shadow-glow);
          }
        `}</style>
      </form>

      {showPreview && (
        <PreviewModal
          onClose={() => setShowPreview(false)}
          title={title}
          description={description}
          price={price}
          isNegotiable={isNegotiable}
          region={region?.name ?? null}
          city={city}
          images={imageUrls}
          conditionLabel={conditionLabel}
          sectionName={selectedSection?.name_ar ?? null}
          sectionIcon={selectedSection?.icon ?? null}
          vehicle={isVehicleSection ? vehicle : null}
          isAuctionable={isAuctionable}
          sellerName={userName}
        />
      )}
    </>
  );
}

function CarRedirectCard({
  sectionName,
  url,
}: {
  sectionName: string;
  url: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)] to-[var(--bg-card)] p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--brand-600)] text-white grid place-items-center shrink-0 shadow-md">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <div className="font-extrabold text-[var(--fg)] text-base">
            {sectionName} تُضاف من داسم الأم
          </div>
          <p className="text-sm text-[var(--fg-muted)] mt-1 leading-relaxed">
            السيارات (والمركبات المتخصصة) تعيش في سجل واحد على{" "}
            <b>dasm.com.sa</b> — منه يقرّر مالك السيارة من لوحته:{" "}
            <span className="whitespace-nowrap">📍 نشر إعلان</span>،{" "}
            <span className="whitespace-nowrap">🔨 طرح للمزاد</span>، أو{" "}
            <span className="whitespace-nowrap">الاثنين معاً</span>.
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 text-xs text-[var(--fg-muted)]">
        <li className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span>سجل واحد للسيارة في كل المنظومة — لا تكرار، لا تعارض.</span>
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span>OCR استمارة + ماركات حسب السوق + فحص دوري + فيديو + تقارير.</span>
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span>
            بعد الإضافة، تظهر سيارتك في لوحتك ويمكنك نشرها هنا في سوق داسم بضغطة.
          </span>
        </li>
      </ul>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <a
          href={url}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md transition"
        >
          أضِف سيارتك من داسم الأم
          <ExternalLink className="w-4 h-4" />
        </a>
        <a
          href="/"
          className="inline-flex items-center justify-center h-12 px-5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-muted)] text-sm font-semibold transition"
        >
          إلغاء
        </a>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Preview Modal ───────────────────────────────────────────────

interface PreviewProps {
  onClose: () => void;
  title: string;
  description: string;
  price: string;
  isNegotiable: boolean;
  region: string | null;
  city: string;
  images: string[];
  conditionLabel: string | null;
  sectionName: string | null;
  sectionIcon: string | null;
  vehicle: VehicleDetails | null;
  isAuctionable: boolean;
  sellerName: string;
}

function PreviewModal({
  onClose,
  title,
  description,
  price,
  isNegotiable,
  region,
  city,
  images,
  conditionLabel,
  sectionName,
  sectionIcon,
  vehicle,
  isAuctionable,
  sellerName,
}: PreviewProps) {
  const cover = images[0];
  const priceLabel = price
    ? `${Number(price).toLocaleString("en-US")} ر.س`
    : "السعر عند التواصل";

  const vehicleLines: string[] = [];
  if (vehicle?.year) vehicleLines.push(`موديل ${vehicle.year}`);
  if (vehicle?.kilometers)
    vehicleLines.push(
      `${Number(vehicle.kilometers).toLocaleString("en-US")} كم`,
    );
  if (vehicle?.transmission) {
    const t = TRANSMISSION_OPTIONS.find((o) => o.value === vehicle.transmission);
    if (t) vehicleLines.push(t.label);
  }
  if (vehicle?.fuel_type) {
    const f = FUEL_OPTIONS.find((o) => o.value === vehicle.fuel_type);
    if (f) vehicleLines.push(f.label);
  }
  if (vehicle?.color) vehicleLines.push(vehicle.color);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--brand-700)]" />
            <div>
              <div className="text-sm font-bold">هكذا سيظهر إعلانك</div>
              <div className="text-[11px] text-[var(--fg-muted)]">
                معاينة — لم يُنشر بعد
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق المعاينة"
            className="w-9 h-9 rounded-lg hover:bg-[var(--bg-muted)] grid place-items-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Cover */}
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="w-full aspect-[16/10] object-cover rounded-xl bg-[var(--bg-muted)]"
            />
          ) : (
            <div className="w-full aspect-[16/10] rounded-xl bg-[var(--bg-muted)] grid place-items-center text-sm text-[var(--fg-muted)]">
              لم تضف صورة غلاف
            </div>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.slice(1, 6).map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${u}-${i}`}
                  src={u}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg border border-[var(--border)]"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            {sectionIcon && <span>{sectionIcon}</span>}
            <span>{sectionName}</span>
            {conditionLabel && (
              <>
                <span>•</span>
                <span>{conditionLabel}</span>
              </>
            )}
          </div>

          <h2 className="text-xl font-extrabold">
            {title || "عنوان الإعلان"}
          </h2>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--brand-700)]">
              {priceLabel}
            </span>
            {price && isNegotiable && (
              <span className="text-xs font-semibold text-[var(--fg-muted)]">
                — قابل للتفاوض
              </span>
            )}
          </div>

          {(region || city) && (
            <div className="text-sm text-[var(--fg-muted)]">
              📍 {[city, region].filter(Boolean).join(" — ")}
            </div>
          )}

          {vehicleLines.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {vehicleLines.map((l) => (
                <span
                  key={l}
                  className="px-2.5 py-1 rounded-full bg-[var(--bg-muted)] text-xs font-semibold"
                >
                  {l}
                </span>
              ))}
            </div>
          )}

          {description && (
            <p className="text-sm text-[var(--fg)] whitespace-pre-wrap leading-relaxed">
              {description}
            </p>
          )}

          <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-soft)] text-xs text-[var(--fg-muted)]">
            <span>البائع:</span>
            <span className="font-semibold text-[var(--fg)]">
              {sellerName || "أنت"}
            </span>
            {isAuctionable && (
              <span className="mr-auto px-2 py-0.5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] font-bold">
                🔨 قابل للمزايدة
              </span>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm"
          >
            رجوع للتحرير
          </button>
        </div>
      </div>
    </div>
  );
}
