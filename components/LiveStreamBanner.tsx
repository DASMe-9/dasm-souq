"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STREAM_URL =
  process.env.NEXT_PUBLIC_STREAM_URL || "https://stream.dasm.com.sa";
const API_URL =
  process.env.NEXT_PUBLIC_DASM_API_URL || "https://api.dasm.com.sa";

const POLL_MS = 30_000;

interface LiveStatus {
  is_live: boolean;
  car_id: number;
  broadcast?: {
    id: number;
    title: string;
    started_at: string | null;
    viewers_count: number;
    /** relative path like "/stream/{id}" */
    stream_url: string;
  };
}

interface LiveStreamBannerProps {
  carId: number;
}

/**
 * Cross-product banner: shown on a souq listing detail when the car
 * is currently being auctioned live on stream. Polls
 * /api/cars/{id}/live-status every 30s.
 *
 * Renders nothing while idle — keeps the listing page clean and avoids
 * any layout jump when the broadcast ends.
 */
export default function LiveStreamBanner({ carId }: LiveStreamBannerProps) {
  const [status, setStatus] = useState<LiveStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`${API_URL}/api/cars/${carId}/live-status`, {
          // Endpoint sets Cache-Control max-age=10/15 — let the browser
          // dedupe in-flight refreshes naturally.
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as LiveStatus;
        if (!cancelled) setStatus(data);
      } catch {
        // Network error: silently keep showing whatever we last had.
        // The banner is decorative; failing closed is the right default.
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [carId]);

  if (!status?.is_live || !status.broadcast) return null;

  const { broadcast } = status;
  const watchUrl = `${STREAM_URL}${broadcast.stream_url}`;

  return (
    <Link
      href={watchUrl}
      target="_blank"
      rel="noopener"
      className="block mb-4 p-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-shadow"
      data-testid="live-stream-banner"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm sm:text-base">
              🔴 يُباع الآن مباشرة في مزاد داسم
            </p>
            <p className="text-xs sm:text-sm opacity-90 truncate">
              {broadcast.title}
              {broadcast.viewers_count > 0 && (
                <span className="mx-2">• {broadcast.viewers_count} مشاهد</span>
              )}
            </p>
          </div>
        </div>
        <span className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-sm shrink-0 hover:bg-gray-100">
          شاهد البث ←
        </span>
      </div>
    </Link>
  );
}
