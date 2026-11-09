// Data situs untuk metadata, robots, sitemap, dan JSON-LD.
export const SITE_URL = (process.env.SITE_URL || "https://ketringkita.edufin.app").replace(/\/+$/, "");
export const SITE_NAME = "KateringKita";
export const SITE_TITLE = "KateringKita — Aplikasi Kelola Pesanan Katering Kampus";
export const SITE_DESCRIPTION =
  "Terima pre-order makanan dari mahasiswa, atur kuota porsi harian, dan pantau penjualan dari satu dashboard. Untuk penjual katering di sekitar kampus.";

// Rute di balik login (sama dengan matcher proxy.ts); tidak perlu dirayapi mesin pencari.
export const PRIVATE_PATHS = [
  "/dashboard", "/menu", "/pesanan", "/laporan", "/promo", "/ulasan",
  "/pengaturan", "/template-wa", "/copilot", "/pratinjau", "/admin", "/api/",
];
