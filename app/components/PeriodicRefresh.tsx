"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Memuat ulang data komponen server tiap `ms` selama tab terlihat, agar halaman yang
 * dibuka lama (mis. percakapan tiket) menampilkan pesan baru tanpa tombol muat ulang.
 * router.refresh() mempertahankan state komponen klien (draf balasan tidak hilang).
 */
export function MuatUlangBerkala({ ms = 5000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, ms);
    return () => clearInterval(t);
  }, [router, ms]);
  return null;
}
