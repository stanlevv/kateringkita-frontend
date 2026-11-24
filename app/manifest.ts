import type { MetadataRoute } from "next";

// Manifest PWA (aplikasi web yang bisa dipasang di layar utama ponsel) untuk pelanggan yang memesan dari meja.

/**
 * Data manifest yang disajikan Next.js di /manifest.webmanifest. Cakupannya hanya /meja, jadi dashboard penjual
 * tidak ditawari untuk dipasang.
 * @returns isi manifest: nama, warna, ikon, dan alamat awal
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/meja",
    name: "KateringKita · Pesan dari meja",
    short_name: "KateringKita",
    description: "Scan QR di meja, pilih menu, lalu bayar dari HP tanpa daftar akun.",
    start_url: "/meja",
    scope: "/meja",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F9F8F6",
    theme_color: "#FF6B35",
    lang: "id",
    icons: [
      { src: "/api/meja/ikon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/meja/ikon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/meja/ikon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
