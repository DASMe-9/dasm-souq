"use client";

/**
 * Direct-upload image gallery for publish form.
 *
 * Pushes each picked file to Core (`POST https://api.dasm.com.sa/api/upload/media`,
 * context=`car_image`) which signs + forwards to Cloudinary and returns
 * the final secure URL. We keep using the `car_image` context for now
 * (folder dasm/cars/images) because the first wave of listings will be
 * vehicles; a dedicated `listing_image` context can be added later in a
 * backend PR without touching this component's callsite.
 *
 * Auth:
 *   - sends the Sanctum session cookie via credentials:"include"
 *   - sends Bearer token from localStorage when available (set by souq
 *     login flow) so the request works even if the origin is not in
 *     Sanctum's stateful-domains list.
 */

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dasm.com.sa/api";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — matches car_image server limit

function formatBytes(n: number) {
  if (n < 1024) return `${n} بايت`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} ك.ب`;
  return `${(n / (1024 * 1024)).toFixed(1)} م.ب`;
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("dasm_token");
  } catch {
    return null;
  }
}

function postWithProgress(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("context", "car_image");
    fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/upload/media`, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    const token = readToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      onProgress(Math.min(100, Math.round((ev.loaded * 100) / ev.total)));
    };

    xhr.onerror = () => reject(new Error("تعذّر الاتصال بالخادم"));
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch {
        /* ignore */
      }
      const b = body as { status?: string; secure_url?: string; message?: string; errors?: Record<string, string[]> };
      if (xhr.status >= 200 && xhr.status < 300 && b?.secure_url) {
        resolve(b.secure_url);
      } else {
        const msg =
          (b?.errors && Object.values(b.errors)[0]?.[0]) ||
          b?.message ||
          `فشل رفع الصورة (HTTP ${xhr.status})`;
        reject(new Error(msg));
      }
    };

    xhr.send(fd);
  });
}

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  urls,
  onChange,
  maxFiles = 10,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runUploads = useCallback(
    async (files: File[]) => {
      setError(null);
      let nextUrls = [...urls];
      for (const f of files) {
        if (nextUrls.length >= maxFiles) break;
        if (f.size > MAX_BYTES) {
          setError(`${f.name}: الحجم يتجاوز ${formatBytes(MAX_BYTES)}`);
          continue;
        }
        setBusy(true);
        setProgress(0);
        try {
          const url = await postWithProgress(f, setProgress);
          nextUrls = [...nextUrls, url];
          onChange(nextUrls);
        } catch (e) {
          setError(e instanceof Error ? e.message : "تعذّر رفع الصورة");
        } finally {
          setBusy(false);
          setProgress(0);
        }
      }
    },
    [urls, onChange, maxFiles],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    void runUploads(files);
  };

  const removeAt = (i: number) => {
    onChange(urls.filter((_, idx) => idx !== i));
  };

  const canAdd = urls.length < maxFiles && !busy && !disabled;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => canAdd && inputRef.current?.click()}
        disabled={!canAdd}
        className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)] text-sm font-semibold text-[var(--fg)] disabled:opacity-60 transition"
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-600)]" />
            <span>جارٍ الرفع… {progress}%</span>
            <div className="w-56 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-[var(--brand-600)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-[var(--brand-600)]" />
            <span>
              اضغط لإضافة صور ({urls.length}/{maxFiles})
            </span>
            <span className="text-xs font-normal text-[var(--fg-muted)]">
              JPG / PNG / WebP / HEIC — حتى {formatBytes(MAX_BYTES)}
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={onPick}
        aria-label="اختر الصور"
      />

      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {urls.map((u, i) => (
            <div
              key={`${u}-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={busy}
                className="absolute top-1 left-1 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white grid place-items-center transition"
                aria-label="إزالة الصورة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {i === 0 && (
                <div className="absolute bottom-1 right-1 bg-[var(--brand-600)] text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                  الغلاف
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
