"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// G-5. Next 16 tidak punya API pemblokir navigasi (hanya Link.onNavigate per tautan),
// jadi tautan internal dicegat di fase capture dan tutup tab lewat beforeunload.
// Tombol kembali browser tidak dicegat.
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();
  const [tujuan, setTujuan] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const sebelum = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    const klik = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      const href = a?.getAttribute("href");
      if (!a || !href || href.startsWith("#") || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
      e.stopPropagation();
      setTujuan(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", sebelum);
    document.addEventListener("click", klik, true);
    return () => {
      window.removeEventListener("beforeunload", sebelum);
      document.removeEventListener("click", klik, true);
    };
  }, [dirty]);

  return {
    open: tujuan !== null,
    cancel: () => setTujuan(null),
    confirm: () => { const t = tujuan; setTujuan(null); if (t) router.push(t); },
  };
}
