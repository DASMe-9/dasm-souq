import { Users, Tag, MapPin, Star } from "lucide-react";

const STATS = [
  { icon: Tag,    value: "+10K",  label: "إعلان مفعّل" },
  { icon: Users,  value: "+50K",  label: "بائع موثّق" },
  { icon: MapPin, value: "13",    label: "منطقة سعودية" },
  { icon: Star,   value: "4.8/5", label: "تقييم المستخدمين" },
];

export default function TrustBar() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg-muted)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-100)] text-[var(--brand-700)] grid place-items-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-lg leading-none tabular-nums">{value}</div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
