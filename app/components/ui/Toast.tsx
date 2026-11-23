"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import { cx } from "./cx";
import { IconButton } from "./IconButton";
import { toneClass, toneIcon } from "./tone";

type ToastItem = {
  id: number;
  tone: Tone;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

// Store kecil di sisi klien (bukan state server); cukup untuk antrean toast.
let items: ToastItem[] = [];
let nextId = 1;
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach((listener) => listener());

export function toast(options: Omit<ToastItem, "id">): number {
  const id = nextId++;
  items = [...items, { ...options, id }];
  emit();
  return id;
}
export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function ToastCard({ item }: { item: ToastItem }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frameId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, []);
  const duration = item.duration ?? (item.tone === "danger" ? 0 : 4000); // 0 = tetap sampai ditutup
  // Jeda saat kursor di atas atau fokus di dalam; lanjut dari awal durasi setelah lepas.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!duration || paused) return;
    const timer = setTimeout(() => dismissToast(item.id), duration);
    return () => clearTimeout(timer);
  }, [duration, item.id, paused]);
  const Icon = toneIcon[item.tone];
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      className={cx(
        "pointer-events-auto flex items-center gap-3 rounded-md border border-line py-1 pl-4 shadow-lg transition duration-200 motion-reduce:transition-none",
        toneClass[item.tone],
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <Icon aria-hidden className="size-5 shrink-0" />
      <p className="flex-1 py-2 text-sm font-medium">{item.message}</p>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action!.onClick();
            dismissToast(item.id);
          }}
          className="min-h-11 rounded-md px-3 text-sm font-semibold underline focus-visible:ring-2 focus-visible:ring-focus"
        >
          {item.action.label}
        </button>
      )}
      <IconButton icon={X} label="Tutup" onClick={() => dismissToast(item.id)} />
    </div>
  );
}

const subscribe = (listener: () => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

export function Toaster() {
  const list = useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
  return (
    <div
      role="region"
      aria-label="Pemberitahuan"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:left-auto sm:w-96"
    >
      {list.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
