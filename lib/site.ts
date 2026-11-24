// Data situs untuk metadata halaman, robots.txt, sitemap, dan JSON-LD (informasi untuk mesin pencari).

/** Alamat utama situs dari env SITE_URL, tanpa garis miring di akhir. */
export const SITE_URL = (process.env.SITE_URL || "https://ketringkita.edufin.app").replace(/\/+$/, "");
/** Nama situs. */
export const SITE_NAME = "KateringKita";
/** Judul bawaan halaman. */
export const SITE_TITLE = "KateringKita — Aplikasi Kelola Pesanan Katering Kampus";
/** Deskripsi bawaan halaman untuk mesin pencari. */
export const SITE_DESCRIPTION =
  "Terima pre-order makanan dari mahasiswa, atur kuota porsi harian, dan pantau penjualan dari satu dashboard. Untuk penjual katering di sekitar kampus.";

/** Rute yang perlu login (sama dengan daftar di proxy.ts); tidak perlu dirayapi mesin pencari. */
export const PRIVATE_PATHS = [
  "/dashboard",
  "/menu",
  "/pesanan",
  "/laporan",
  "/promo",
  "/ulasan",
  "/pengaturan",
  "/template-wa",
  "/copilot",
  "/pratinjau",
  "/admin",
  "/api/",
];

/** Alamat aplikasi pembeli dari env BUYER_APP_URL (tanpa garis miring di akhir); kosong = tombol "Pesan lewat aplikasi" disembunyikan. */
export const BUYER_APP_URL: string | null = process.env.BUYER_APP_URL?.replace(/\/+$/, "") || null;
