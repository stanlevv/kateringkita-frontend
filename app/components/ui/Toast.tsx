"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import type { Nada } from "@/lib/order-status";
import { cx } from "./cx";
import { IconButton } from "./IconButton";
import { toneClass, toneIcon } from "./tone";

type Item = { id: number; tone: Nada; message: string; action?: { label: string; onClick: () => void }; duration?: number };

// Store kecil di sisi klien (bukan state server); cukup untuk antrean toast.
let items: Item[] = [];
let nextId = 1;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(t: Omit<Item, "id">): number {
  const id = nextId++;
  items = [...items, { ...t, id }];
  emit();
  return id;
}
export function dismissToast(id: number) {
  items = items.filter((i) => i.id !== id);
  emit();
}

function Kartu({ t }: { t: Item }) {
  const [tampil, setTampil] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setTampil(true)); return () => cancelAnimationFrame(r); }, []);
  const durasi = t.duration ?? (t.tone === "danger" ? 0 : 4000); // 0 = tetap sampai ditutup
  // Jeda saat kursor di atas atau fokus di dalam; lanjut dari awal durasi setelah lepas.
  const [jeda, setJeda] = useState(false);
  useEffect(() => {
    if (!durasi || jeda) return;
    const h = setTimeout(() => dismissToast(t.id), durasi);
    return () => clearTimeout(h);
  }, [durasi, t.id, jeda]);
  const Icon = toneIcon[t.tone];
  return (
    <div
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
      onFocus={() => setJeda(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setJeda(false); }}
      className={cx("pointer-events-auto flex items-center gap-3 rounded-md border border-line py-1 pl-4 shadow-lg transition duration-200 motion-reduce:transition-none", toneClass[t.tone], tampil ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
      <Icon aria-hidden className="size-5 shrink-0" />
      <p className="flex-1 py-2 text-sm font-medium">{t.message}</p>
      {t.action && (
        <button type="button" onClick={() => { t.action!.onClick(); dismissToast(t.id); }} className="min-h-11 rounded-md px-3 text-sm font-semibold underline focus-visible:ring-2 focus-visible:ring-focus">
          {t.action.label}
        </button>
      )}
      <IconButton icon={X} label="Tutup" onClick={() => dismissToast(t.id)} />
    </div>
  );
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => items);
  return (
    <div role="region" aria-label="Pemberitahuan" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:left-auto sm:w-96">
      {list.map((t) => <Kartu key={t.id} t={t} />)}
    </div>
  );
}
