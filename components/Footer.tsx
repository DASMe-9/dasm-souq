import { Mail, Phone, Globe, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] grid place-items-center text-white font-extrabold">
                د
              </div>
              <span className="font-extrabold">سوق داسم</span>
            </div>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed mb-3">
              السوق المفتوح للسعودية — إعلانات، مزادات، وإجراءات رسمية بمكان واحد.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-[11px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              منصة سعودية موثّقة
            </div>
          </div>

          <FooterCol
            title="السوق"
            links={[
              { label: "كل الأقسام", href: "#categories" },
              { label: "الإعلانات المميّزة", href: "#" },
              { label: "المزادات الحيّة", href: "#" },
              { label: "أحدث الإعلانات", href: "#" },
            ]}
          />
          <FooterCol
            title="منظومة DASM"
            links={[
              { label: "منصة داسم الأم", href: "https://www.dasm.com.sa" },
              { label: "داسم توك (محادثات)", href: "https://talk.dasm.com.sa" },
              { label: "داسم ستريم (بث)", href: "https://stream.dasm.com.sa" },
              { label: "لوحة التحكم", href: "https://control.dasm.com.sa" },
            ]}
          />
          <FooterCol
            title="تواصل ودعم"
            links={[
              { label: "info@dasm.com.sa", href: "mailto:info@dasm.com.sa", icon: Mail },
              { label: "920000000", href: "tel:920000000", icon: Phone },
              { label: "dasm.com.sa", href: "https://www.dasm.com.sa", icon: Globe },
            ]}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-3 text-xs text-[var(--fg-muted)]">
          <p>© {new Date().getFullYear()} سوق داسم — جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[var(--brand-700)] transition">سياسة الخصوصية</a>
            <a href="#" className="hover:text-[var(--brand-700)] transition">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title, links,
}: { title: string; links: { label: string; href: string; icon?: React.ComponentType<{ className?: string }> }[] }) {
  return (
    <div>
      <h3 className="font-bold text-sm mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-xs text-[var(--fg-muted)] hover:text-[var(--brand-700)] transition inline-flex items-center gap-1.5">
              {l.icon && <l.icon className="w-3 h-3" />}
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
