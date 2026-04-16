"use client";

import { useState } from "react";
import {
  Car as CarIcon,
  Gavel,
  Eye,
  Heart,
  Plus,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Pause,
  Compass,
} from "lucide-react";
import type { GarageData, GarageCar } from "@/lib/garage";
import DecideDestinationModal from "@/components/DecideDestinationModal";
import EditCarModal from "@/components/EditCarModal";

interface Props {
  garage: GarageData | null;
  userName: string;
}

export default function GarageView({ garage }: Props) {
  // Lift the modals so they live ABOVE the cards. Both open INSIDE souq
  // (no navigation) and post directly to api.dasm.com.sa using the user's
  // Bearer token.
  const [decideCar, setDecideCar] = useState<GarageCar | null>(null);
  const [editCar, setEditCar] = useState<GarageCar | null>(null);

  if (!garage) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
        <p className="text-sm text-[var(--fg-muted)]">
          تعذّر تحميل بياناتك. حاول تحديث الصفحة بعد لحظات.
        </p>
      </div>
    );
  }

  if (garage.cars.length === 0) {
    return <EmptyGarage />;
  }

  return (
    <>
      <SummaryStrip summary={garage.summary} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {garage.cars.map((car) => (
          <CarCard
            key={car.id}
            car={car}
            onDecide={() => setDecideCar(car)}
            onEdit={() => setEditCar(car)}
          />
        ))}
      </div>

      {decideCar && (
        <DecideDestinationModal
          carId={decideCar.id}
          carLabel={decideCar.title}
          prefillPrices={{ fixed_price: decideCar.price ?? null }}
          onClose={() => setDecideCar(null)}
          onSuccess={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
      )}

      {editCar && (
        <EditCarModal
          carId={editCar.id}
          onClose={() => setEditCar(null)}
          onSaved={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
      )}
    </>
  );
}

// ─── Summary strip ─────────────────────────────────────

function SummaryStrip({ summary }: { summary: GarageData["summary"] }) {
  const cells = [
    { label: "إجمالي السيارات", value: summary.total_cars, color: "var(--brand-700)" },
    { label: "في سوق داسم", value: summary.in_souq, color: "#0a5c36" },
    { label: "في مزاد", value: summary.in_auction, color: "#c2410c" },
    { label: "خاملة", value: summary.idle, color: "var(--fg-muted)" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center"
        >
          <div
            className="text-2xl font-extrabold tabular-nums"
            style={{ color: c.color }}
          >
            {c.value}
          </div>
          <div className="text-xs text-[var(--fg-muted)] mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Single car card ───────────────────────────────────

function CarCard({
  car,
  onDecide,
  onEdit,
}: {
  car: GarageCar;
  onDecide: () => void;
  onEdit: () => void;
}) {
  const inSouq = car.destinations.souq_listing.active;
  const inAuction = car.destinations.auction.active;
  const priceLabel = car.price
    ? `${Number(car.price).toLocaleString("en-US")} ر.س`
    : "السعر عند التواصل";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="aspect-[16/10] bg-[var(--bg-muted)] relative">
        {car.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.image_url}
            alt={car.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-[var(--fg-soft)]">
            <CarIcon className="w-10 h-10" />
          </div>
        )}

        {/* Badges layered on top of the cover */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {inSouq && (
            <Badge color="emerald" icon={<CheckCircle2 className="w-3 h-3" />}>
              منشورة في سوق داسم
            </Badge>
          )}
          {inAuction && (
            <Badge color="orange" icon={<Gavel className="w-3 h-3" />}>
              في مزاد
            </Badge>
          )}
          {!inSouq && !inAuction && (
            <Badge color="slate" icon={<Pause className="w-3 h-3" />}>
              خاملة
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-extrabold text-[var(--fg)] truncate">
          {car.title}
        </h3>
        <div className="text-xs text-[var(--fg-muted)] mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
          {car.city && <span>📍 {car.city}</span>}
          {car.odometer && <span>{car.odometer} كم</span>}
        </div>

        <div className="mt-3 text-lg font-extrabold text-[var(--brand-700)]">
          {priceLabel}
        </div>

        {/* Destination quick stats */}
        {(inSouq || inAuction) && (
          <div className="mt-3 space-y-1.5 text-xs">
            {inSouq && (
              <div className="flex items-center gap-3 text-[var(--fg-muted)]">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {car.destinations.souq_listing.views ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {car.destinations.souq_listing.favorites ?? 0}
                </span>
              </div>
            )}
            {inAuction && car.destinations.auction.ends_at && (
              <div className="text-[var(--fg-muted)]">
                ينتهي:{" "}
                {new Date(car.destinations.auction.ends_at).toLocaleString(
                  "ar-SA",
                  { dateStyle: "medium", timeStyle: "short" },
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-4 space-y-2">
          {/* Primary action: decide destination — opens the modal IN PLACE
              (no navigation). The modal posts directly to api.dasm.com.sa
              using the seller's Bearer token. */}
          <button
            type="button"
            onClick={onDecide}
            className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[var(--accent-orange)] hover:opacity-90 text-white text-xs font-bold transition"
          >
            <Compass className="w-3.5 h-3.5" />
            قرّر الوجهة
          </button>

          <div className="flex gap-2">
            {inSouq && car.destinations.souq_listing.listing_id && (
              <a
                href={`/listings/${car.destinations.souq_listing.listing_id}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-xs font-bold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                عرض البطاقة
              </a>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--fg)] text-xs font-bold transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Badge primitive ───────────────────────────────────

function Badge({
  children,
  color,
  icon,
}: {
  children: React.ReactNode;
  color: "emerald" | "orange" | "slate";
  icon?: React.ReactNode;
}) {
  const styles = {
    emerald: "bg-emerald-600 text-white",
    orange: "bg-orange-600 text-white",
    slate: "bg-slate-700 text-white",
  }[color];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${styles}`}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── Empty state ───────────────────────────────────────

function EmptyGarage() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] p-8 sm:p-12 text-center">
      <div className="inline-flex w-16 h-16 rounded-2xl bg-[var(--brand-50)] items-center justify-center mb-4">
        <CarIcon className="w-8 h-8 text-[var(--brand-600)]" />
      </div>
      <h2 className="text-xl font-extrabold text-[var(--fg)] mb-2">
        لا توجد سيارات في مساحتك بعد
      </h2>
      <p className="text-sm text-[var(--fg-muted)] mb-5 max-w-md mx-auto">
        أضف سيارتك مرة واحدة من داسم الأم — ثم تحكّم بنشرها في سوق داسم أو
        طرحها للمزاد من هنا.
      </p>
      <a
        href="https://www.dasm.com.sa/dashboard/add-car"
        className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md transition"
      >
        <Plus className="w-4 h-4" />
        أضف سيارتك من داسم الأم
      </a>
    </div>
  );
}
