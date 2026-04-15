"use client";

import { useState } from "react";
import { Search, MapPin, Plus, Menu, X, Bell, User, ChevronDown } from "lucide-react";

const POPULAR_CITIES = ["كل المناطق", "الرياض", "جدة", "الدمام", "مكة", "المدينة", "أبها", "الطائف", "بريدة"];

export default function Header() {
  const [city, setCity] = useState("كل المناطق");
  const [cityOpen, setCityOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-lg">د</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-extrabold text-[var(--fg)] text-lg leading-tight">سوق داسم</div>
              <div className="text-[10px] text-[var(--fg-muted)] -mt-0.5">السوق المفتوح للمملكة</div>
            </div>
          </a>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="flex w-full rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] overflow-hidden focus-within:border-[var(--brand-500)] transition">
              {/* City picker */}
              <div className="relative">
                <button
                  onClick={() => setCityOpen((v) => !v)}
                  className="h-12 px-4 flex items-center gap-2 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-card)] transition border-l border-[var(--border)]"
                >
                  <MapPin className="w-4 h-4 text-[var(--brand-600)]" />
                  <span className="max-w-[100px] truncate">{city}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition ${cityOpen ? "rotate-180" : ""}`} />
                </button>
                {cityOpen && (
                  <div className="absolute top-full mt-1 right-0 w-52 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-lg overflow-hidden z-50">
                    {POPULAR_CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCity(c); setCityOpen(false); }}
                        className={`block w-full text-right px-4 py-2.5 text-sm hover:bg-[var(--bg-muted)] transition ${
                          city === c ? "text-[var(--brand-700)] font-bold bg-[var(--brand-50)]" : "text-[var(--fg)]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search input */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-soft)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن سيارة، عقار، جهاز..."
                  className="w-full h-12 pr-10 pl-4 bg-transparent text-sm placeholder-[var(--fg-soft)] focus:outline-none"
                />
              </div>

              {/* Search button */}
              <button className="h-12 px-5 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm transition">
                بحث
              </button>
            </div>
          </div>

          {/* Right actions — desktop */}
          <div className="hidden md:flex items-center gap-2 mr-auto">
            <button
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--accent-orange)] hover:opacity-90 text-white font-bold text-sm shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              أضف إعلان
            </button>
            <button className="w-10 h-10 rounded-xl hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] grid place-items-center transition" title="الإشعارات">
              <Bell className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-xl hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] grid place-items-center transition" title="حسابي">
              <User className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden mr-auto w-10 h-10 rounded-xl hover:bg-[var(--bg-muted)] grid place-items-center transition"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile search row — always visible on mobile */}
        <div className="md:hidden pb-3">
          <div className="flex items-center gap-2 h-12 px-3 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] focus-within:border-[var(--brand-500)] transition">
            <Search className="w-4 h-4 text-[var(--fg-soft)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في سوق داسم..."
              className="flex-1 bg-transparent text-sm placeholder-[var(--fg-soft)] focus:outline-none"
            />
            <button className="h-9 px-3 rounded-lg bg-[var(--brand-600)] text-white text-xs font-bold">بحث</button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <button className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--accent-orange)] text-white font-bold text-sm">
              <Plus className="w-4 h-4" />
              أضف إعلانك مجاناً
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="h-10 rounded-xl border border-[var(--border)] text-sm font-semibold flex items-center justify-center gap-1.5">
                <User className="w-4 h-4" /> دخول
              </button>
              <button className="h-10 rounded-xl border border-[var(--border)] text-sm font-semibold flex items-center justify-center gap-1.5">
                <MapPin className="w-4 h-4" /> {city}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
