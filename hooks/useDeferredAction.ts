// Hook useDeferredAction: menunda aksi beberapa detik agar masih bisa dibatalkan (tombol "Batalkan" di toast).
// Dipakai di OrderQueue (app/(dashboard)/dashboard/components) untuk aksi pesanan.
// Hook React = fungsi `useX` yang menyimpan state dan efek untuk komponen yang memanggilnya.
// "use client": file ini hanya berjalan di peramban (client component), bukan di server.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Menahan aksi per kunci (mis. kode pesanan) selama `delayMs` agar bisa dibatalkan. Tiap aksi dijalankan tepat sekali:
 * saat waktu habis, atau lebih awal saat komponen dilepas / halaman ditinggal (`pagehide`).
 * @param run fungsi yang menjalankan aksi, dipanggil dengan kunci dan argumennya
 * @param delayMs lama penundaan (bawaan 5 dtk)
 * @returns `schedule(key, arg)` untuk menunda aksi, `undo(key)` untuk membatalkannya (true bila berhasil),
 *   dan `pending` (aksi yang masih tertunda, per kunci)
 */
export function useDeferredAction<A>(run: (key: string, arg: A) => void, delayMs = 5000) {
  // 1. State aksi tertunda (untuk tampilan) dan antrean berisi timer per kunci.
  const [pending, setPending] = useState<Record<string, A>>({});
  const queue = useRef(new Map<string, { arg: A; timer: ReturnType<typeof setTimeout> }>());
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });

  // 2. Keluarkan satu aksi dari antrean (hentikan timernya); mengembalikan aksinya atau null.
  const release = useCallback((key: string) => {
    const entry = queue.current.get(key);
    if (!entry) return null;
    clearTimeout(entry.timer);
    queue.current.delete(key); // dihapus sebelum run agar tidak mungkin jalan dua kali
    setPending((previousPending) => {
      const nextPending = { ...previousPending };
      delete nextPending[key];
      return nextPending;
    });
    return entry;
  }, []);

  // 3. Jalankan aksi sekarang bila masih tertunda.
  const runNow = useCallback(
    (key: string) => {
      const entry = release(key);
      if (entry) runRef.current(key, entry.arg);
    },
    [release],
  );

  // 4. Tunda aksi baru; aksi lama dengan kunci yang sama dijalankan dulu.
  const schedule = useCallback(
    (key: string, arg: A) => {
      runNow(key);
      queue.current.set(key, { arg, timer: setTimeout(() => runNow(key), delayMs) });
      setPending((previousPending) => ({ ...previousPending, [key]: arg }));
    },
    [delayMs, runNow],
  );

  /** `true` bila aksi masih tertunda dan berhasil dibatalkan. */
  const undo = useCallback((key: string) => !!release(key), [release]);

  // 5. Halaman ditinggal (pagehide) atau komponen dilepas: jalankan semua yang tertunda agar tidak hilang.
  useEffect(() => {
    const runAll = () => [...queue.current.keys()].forEach(runNow);
    window.addEventListener("pagehide", runAll);
    return () => {
      window.removeEventListener("pagehide", runAll);
      runAll();
    };
  }, [runNow]);

  return { schedule, undo, pending };
}
