"use client";

import { cx, fokus } from "./cx";

export type Tab = { id: string; label: string; count?: number };

export function Tabs({ tabs, value, onChange, label }: { tabs: Tab[]; value: string; onChange: (id: string) => void; label: string }) {
  const pindah = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const t = tabs[(i + d + tabs.length) % tabs.length];
    onChange(t.id);
    document.getElementById(`tab-${t.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t, i) => {
        const aktif = t.id === value;
        return (
          <button key={t.id} id={`tab-${t.id}`} role="tab" type="button" aria-selected={aktif} tabIndex={aktif ? 0 : -1}
            onClick={() => onChange(t.id)} onKeyDown={(e) => pindah(e, i)}
            className={cx("inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 font-medium", fokus, aktif ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink")}>
            {t.label}
            {t.count !== undefined && <span className="rounded-md bg-subtle px-1.5 font-mono text-sm text-ink">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
