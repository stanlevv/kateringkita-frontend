"use client";

import { cx, focusRing } from "./cx";

export type Tab = { id: string; label: string; count?: number };

export function Tabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const moveFocus = (event: React.KeyboardEvent, i: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const nextTab = tabs[(i + step + tabs.length) % tabs.length];
    onChange(nextTab.id);
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => moveFocus(event, i)}
            className={cx(
              "inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 font-medium",
              focusRing,
              selected ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-md bg-subtle px-1.5 font-mono text-sm text-ink">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
