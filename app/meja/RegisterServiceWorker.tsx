// Komponen RegisterServiceWorker: mendaftarkan service worker /sw-meja.js untuk halaman /meja.
// Service worker adalah skrip yang dipasang peramban di latar belakang; di sini gunanya hanya agar /meja bisa dipasang
// ke layar utama HP (lihat public/sw-meja.js, sengaja tanpa cache supaya menu dan stok selalu terbaru).
// "use client": komponen ini berjalan di peramban (client component) karena memakai useEffect dan navigator.
"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan service worker sekali setelah halaman tampil. Peramban tanpa dukungan service worker dilewati, dan
 * kegagalan daftar diabaikan karena tidak mengganggu pemesanan.
 * @returns null (tidak menampilkan apa pun)
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw-meja.js", { scope: "/meja" }).catch(() => {});
  }, []);
  return null;
}
