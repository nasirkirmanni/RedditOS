"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Download } from "lucide-react";

export default function SettingsPanel() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as "light" | "dark") ?? "dark");
  }, []);

  function applyTheme(next: "dark" | "light") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  const row =
    "flex items-center justify-between gap-4 border-b border-[var(--gridline)] py-3 last:border-0";

  return (
    <div className="space-y-5">
      <section className="card px-5 py-4">
        <h2 className="text-base font-semibold">Appearance</h2>
        <div className={row}>
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-[var(--text-muted)]">
              Dark is the default.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-[var(--border)] p-1">
            <button
              onClick={() => applyTheme("dark")}
              aria-pressed={theme === "dark"}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                theme === "dark"
                  ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Moon size={14} aria-hidden="true" /> Dark
            </button>
            <button
              onClick={() => applyTheme("light")}
              aria-pressed={theme === "light"}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                theme === "light"
                  ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Sun size={14} aria-hidden="true" /> Light
            </button>
          </div>
        </div>
      </section>

      <section className="card px-5 py-4">
        <h2 className="text-base font-semibold">Data</h2>
        <div className={row}>
          <div>
            <p className="text-sm font-medium">Export everything</p>
            <p className="text-xs text-[var(--text-muted)]">
              JSON dump of accounts, karma history, subreddits, and activity logs.
            </p>
          </div>
          <a
            href="/api/export"
            download
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium hover:bg-[var(--baseline)]"
          >
            <Download size={14} aria-hidden="true" /> Export JSON
          </a>
        </div>
      </section>
    </div>
  );
}
