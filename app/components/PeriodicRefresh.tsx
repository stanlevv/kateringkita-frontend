// Komponen PeriodicRefresh: memuat ulang data halaman secara berkala (polling) tanpa menampilkan apa pun.
// Dipakai halaman percakapan tiket admin. Polling = bertanya ulang ke server tiap selang waktu tetap.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Memuat ulang data komponen server tiap `intervalMs` selama tab terlihat, agar halaman yang
 * dibuka lama (mis. percakapan tiket) menampilkan pesan baru tanpa tombol muat ulang.
 * router.refresh() mempertahankan state komponen klien (draf balasan tidak hilang).
 * @param props.intervalMs selang muat ulang dalam milidetik (bawaan 5000)
 * @returns null (tidak merender apa pun)
 */
export function PeriodicRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  // Pasang timer saat komponen tampil dan hentikan saat komponen dilepas; tab tersembunyi dilewati.
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(intervalId);
  }, [router, intervalMs]);
  return null;
}
