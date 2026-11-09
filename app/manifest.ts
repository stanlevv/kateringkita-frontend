import type { MetadataRoute } from "next";

// F21: PWA untuk pelanggan pesan dari meja. Scope /meja: dashboard penjual di luar scope sehingga tidak ditawari dipasang.
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
      { src: "/meja/ikon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/meja/ikon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/meja/ikon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
