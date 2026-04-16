import { TrendingUp, ShieldCheck, MessageCircle, Gavel } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-bl from-[var(--brand-50)] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[var(--brand-500)]/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Copy */}
          <div className="text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-100)] text-[var(--brand-800)] text-xs font-bold mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-600)] animate-pulse-soft" />
              مفتوح الآن — على مدار الساعة
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3">
              سوقك المفتوح
              <br />
              في <span className="text-gradient">سوق داسم</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--fg-muted)] max-w-lg mx-auto md:mx-0 mb-6">
              سيارات، عقار، أجهزة، ومنتجات السوق السعودي — مع محادثة مدمجة، مزادات حيّة، وإجراءات بيع رسمية.
            </p>

            {/* CTAs 'تصفّح الأقسام' + 'ابدأ بإعلان' were removed on
                2026-04-16 per owner request. Reasoning: the Header bar
                already exposes 'أضف إعلان' (primary) + 'بحث' + the
                categories appear right below the hero as a full grid,
                so the hero buttons were duplicating both the header
                and the section beneath them. Less is more. */}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            <FeatureCard
              icon={<MessageCircle className="w-5 h-5" />}
              title="محادثة مدمجة"
              desc="تفاوض مباشرة مع البائع — صور، صوت، فيديو."
              accent="var(--brand-600)"
            />
            <FeatureCard
              icon={<Gavel className="w-5 h-5" />}
              title="مزادات حيّة"
              desc="قدّم مزايدتك لايف على المنتجات المفتوحة للمزاد."
              accent="var(--accent-orange)"
            />
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5" />}
              title="إجراءات رسمية"
              desc="نقل ملكية وتسوية مالية موثّقة لكل صفقة."
              accent="var(--accent-blue)"
            />
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="بيانات سوق ذكية"
              desc="أسعار مرجعية، وتحليلات لكل قسم لتتخذ قرارك."
              accent="var(--accent-amber)"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon, title, desc, accent,
}: { icon: React.ReactNode; title: string; desc: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4 card-lift">
      <div
        className="w-10 h-10 rounded-xl grid place-items-center mb-3 text-white"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <h3 className="font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}
