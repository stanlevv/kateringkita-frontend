"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * DB-A2: tahan aksi per kunci selama `delayMs` agar bisa dibatalkan. Dijalankan tepat sekali:
 * saat waktu habis, atau lebih awal saat komponen dilepas / halaman ditinggal (`pagehide`).
 */
export function useDeferredAction<A>(run: (key: string, arg: A) => void, delayMs = 5000) {
  const [pending, setPending] = useState<Record<string, A>>({});
  const queue = useRef(new Map<string, { arg: A; timer: ReturnType<typeof setTimeout> }>());
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });

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

  const runNow = useCallback(
    (key: string) => {
      const entry = release(key);
      if (entry) runRef.current(key, entry.arg);
    },
    [release],
  );

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
