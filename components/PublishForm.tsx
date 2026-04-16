"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Check,
  Loader2,
  Gavel,
  AlertTriangle,
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

export default function PublishForm({ sections, regions }: Props) {
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSection = sections.find((s) => s.id === sectionId);
  const region = regions.find((r) => r.code === areaCode);

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

    const cleanImages = imageUrls.filter((u) => /^https?:\/\/\S+/.test(u));

    const payload = {
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
    };

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
      const id = body?.data?.id;
      if (id) router.push(`/listings/${id}`);
      else router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      setSubmitting(false);
    }
  }

  return (
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
          disabled={submitting}
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

      {/* Submit */}
      <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4 border-t border-[var(--border-soft)]">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold shadow-md transition disabled:opacity-60"
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
        <a
          href="/"
          className="inline-flex items-center justify-center h-12 px-5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-muted)] text-sm font-bold transition"
        >
          إلغاء
        </a>
      </div>

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
