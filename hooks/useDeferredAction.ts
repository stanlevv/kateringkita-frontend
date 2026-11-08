"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * DB-A2: tahan aksi per kunci selama `delayMs` agar bisa dibatalkan. Dijalankan tepat sekali:
 * saat waktu habis, atau lebih awal saat komponen dilepas / halaman ditinggal (`pagehide`).
 */
export function useDeferredAction<A>(run: (key: string, arg: A) => void, delayMs = 5000) {
  const [pending, setPending] = useState<Record<string, A>>({});
  const antre = useRef(new Map<string, { arg: A; t: ReturnType<typeof setTimeout> }>());
  const runRef = useRef(run);
  useEffect(() => { runRef.current = run; });

  const lepas = useCallback((key: string) => {
    const p = antre.current.get(key);
    if (!p) return null;
    clearTimeout(p.t);
    antre.current.delete(key); // dihapus sebelum run agar tidak mungkin jalan dua kali
    setPending((lama) => {
      const baru = { ...lama };
      delete baru[key];
      return baru;
    });
    return p;
  }, []);

  const jalankan = useCallback((key: string) => {
    const p = lepas(key);
    if (p) runRef.current(key, p.arg);
  }, [lepas]);

  const schedule = useCallback((key: string, arg: A) => {
    jalankan(key);
    antre.current.set(key, { arg, t: setTimeout(() => jalankan(key), delayMs) });
    setPending((p) => ({ ...p, [key]: arg }));
  }, [delayMs, jalankan]);

  /** `true` bila aksi masih tertunda dan berhasil dibatalkan. */
  const undo = useCallback((key: string) => !!lepas(key), [lepas]);

  useEffect(() => {
    const semua = () => [...antre.current.keys()].forEach(jalankan);
    window.addEventListener("pagehide", semua);
    return () => {
      window.removeEventListener("pagehide", semua);
      semua();
    };
  }, [jalankan]);

  return { schedule, undo, pending };
}
