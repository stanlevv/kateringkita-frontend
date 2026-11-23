"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Memuat ulang data komponen server tiap `ms` selama tab terlihat, agar halaman yang
 * dibuka lama (mis. percakapan tiket) menampilkan pesan baru tanpa tombol muat ulang.
 * router.refresh() mempertahankan state komponen klien (draf balasan tidak hilang).
 */
export function PeriodicRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(intervalId);
  }, [router, intervalMs]);
  return null;
}
