"use client";

/**
 * ThemeSwitcher — three-icon segmented control (System / Light / Dark).
 *
 * Mirrors the Vercel dashboard's user-menu theme row: a single-line
 * widget inside an existing dropdown, no modal. The choice is written
 * to localStorage under "dasm-theme" and applied to <html data-theme>
 * immediately; the inline script in layout.tsx picks it up on first
 * paint on the next navigation so there's no FOUC.
 *
 * "System" clears the attribute so the CSS falls through to the
 * prefers-color-scheme media query — i.e. the OS decides.
 */

import { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";

type Mode = "system" | "light" | "dark";

const STORAGE_KEY = "dasm-theme";

function readStored(): Mode {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function apply(mode: Mode): void {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  } else {
    root.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }
}

export default function ThemeSwitcher() {
  // Start as "system" on the server so the initial HTML matches for every
  // visitor (no hydration mismatch). After mount we sync to the real stored
  // value. This is the same pattern Vercel uses.
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    setMode(readStored());
  }, []);

  function pick(next: Mode) {
    setMode(next);
    apply(next);
  }

  const baseBtn =
    "w-7 h-7 grid place-items-center rounded-md transition text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)]";
  const activeBtn =
    "w-7 h-7 grid place-items-center rounded-md bg-[var(--bg-card)] text-[var(--fg)] shadow-sm border border-[var(--border)]";

  return (
    <div className="flex items-center justify-between px-4 py-2 hover:bg-transparent">
      <span className="text-sm text-[var(--fg)]">المظهر</span>
      <div
        role="group"
        aria-label="اختيار المظهر"
        className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--bg-muted)]"
      >
        <button
          type="button"
          onClick={() => pick("system")}
          className={mode === "system" ? activeBtn : baseBtn}
          title="حسب النظام"
          aria-pressed={mode === "system"}
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => pick("light")}
          className={mode === "light" ? activeBtn : baseBtn}
          title="نهار"
          aria-pressed={mode === "light"}
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => pick("dark")}
          className={mode === "dark" ? activeBtn : baseBtn}
          title="ليل"
          aria-pressed={mode === "dark"}
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
