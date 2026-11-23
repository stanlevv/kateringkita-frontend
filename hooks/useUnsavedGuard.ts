// Hook useUnsavedGuard: mencegah perubahan form hilang saat penjual pindah halaman atau menutup tab.
// Dipakai di MenuForm, SettingsForm, dan TemplateEditor (form yang bisa punya perubahan belum disimpan).
// Hook React = fungsi `useX` yang menyimpan state dan efek untuk komponen yang memanggilnya.
// "use client": file ini hanya berjalan di peramban (client component), bukan di server.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Selama `dirty`, klik tautan internal ditahan dan tujuannya disimpan, supaya komponen bisa menampilkan dialog
 * "tinggalkan halaman?". Menutup tab memunculkan peringatan bawaan peramban (beforeunload).
 * Next 16 hanya punya Link.onNavigate per tautan, jadi semua tautan dicegat sekaligus di fase capture (sebelum
 * tautan itu sendiri menerima klik). Tombol kembali peramban tidak dicegat.
 * @param dirty true bila form punya perubahan yang belum disimpan
 * @returns `open` (dialog perlu tampil), `cancel()` (tetap di halaman), `confirm()` (lanjut ke tujuan yang ditahan)
 */
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    // 1. Tanpa perubahan, tidak ada yang dicegat.
    if (!dirty) return;
    // 2. Menutup atau memuat ulang tab: minta peramban menampilkan peringatan.
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    // 3. Klik tautan: hanya klik kiri biasa ke halaman lain di situs ini yang ditahan.
    const onLinkClick = (event: MouseEvent) => {
      // 1. Abaikan klik yang sudah ditangani, bukan klik kiri, atau memakai tombol pengubah (buka di tab baru).
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      // 2. Abaikan yang bukan tautan, tautan ke bagian halaman (#), tab lain, atau unduhan.
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      const href = anchor?.getAttribute("href");
      if (
        !anchor ||
        !href ||
        href.startsWith("#") ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      )
        return;
      // 3. Hanya situs ini; tahan navigasi dan simpan tujuannya.
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    };
    // 4. Pasang pendengar; dilepas lagi saat form bersih atau komponen dilepas.
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [dirty]);

  return {
    open: pendingHref !== null,
    cancel: () => setPendingHref(null),
    confirm: () => {
      const target = pendingHref;
      setPendingHref(null);
      if (target) router.push(target);
    },
  };
}
