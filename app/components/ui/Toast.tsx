// Komponen Toast: pesan singkat yang muncul di pojok bawah lalu hilang sendiri (mis. "Tersimpan").
// `toast()` bisa dipanggil dari mana saja; `<Toaster />` dipasang sekali di layout untuk menampilkannya.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import { cx } from "./cx";
import { IconButton } from "./IconButton";
import { toneClass, toneIcon } from "./tone";

// Satu pesan: nada, teks, aksi opsional (mis. "Batalkan"), dan lama tampil (0 = sampai ditutup).
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

/**
 * Menampilkan pesan toast.
 * @param options nada, pesan, aksi opsional, dan lama tampil (bawaan 4 dtk; danger tetap sampai ditutup)
 * @returns id toast, untuk menutupnya lewat dismissToast
 */
export function toast(options: Omit<ToastItem, "id">): number {
  const id = nextId++;
  items = [...items, { ...options, id }];
  emit();
  return id;
}
/**
 * Menutup toast.
 * @param id id dari toast()
 */
export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

// Satu kartu toast: muncul dengan animasi, hilang setelah durasinya, dan berhenti menghitung selama disorot.
function ToastCard({ item }: { item: ToastItem }) {
  // 1. Animasi masuk: tampil pada frame berikutnya agar transisi CSS berjalan.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frameId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, []);
  // 2. Timer tutup otomatis.
  const duration = item.duration ?? (item.tone === "danger" ? 0 : 4000); // 0 = tetap sampai ditutup
  // Jeda saat kursor di atas atau fokus di dalam; lanjut dari awal durasi setelah lepas.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!duration || paused) return;
    const timer = setTimeout(() => dismissToast(item.id), duration);
    return () => clearTimeout(timer);
  }, [duration, item.id, paused]);
  // 3. Ikon sesuai nada.
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

// Langganan perubahan daftar toast untuk useSyncExternalStore (cara React membaca nilai dari luar React).
const subscribe = (listener: () => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

/**
 * Wilayah tampil semua toast. Memakai aria-live="polite": pembaca layar membacakan pesan baru tanpa memindahkan fokus.
 * @returns elemen `div` role="region"
 */
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
