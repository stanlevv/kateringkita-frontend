// Data contoh kategori, titik temu, dan jenis usaha untuk test. Salinan data awal di docs/schema.sql.

import type { Category, MerchantType, PickupPoint } from "@/types/meta";

/**
 * Daftar kategori contoh.
 * @returns daftar kategori
 */
export const categories = (): Category[] => [
  { id: 1, name: "Nasi Box", slug: "nasi-box" },
  { id: 2, name: "Ayam", slug: "ayam" },
  { id: 3, name: "Martabak", slug: "martabak" },
  { id: 4, name: "Snack & Kue", slug: "snack" },
  { id: 5, name: "Minuman", slug: "minuman" },
  { id: 6, name: "Paket Acara", slug: "paket-acara" },
  { id: 7, name: "Danusan", slug: "danusan" },
];

/**
 * Daftar titik temu contoh.
 * @returns daftar titik temu
 */
export const pickupPoints = (): PickupPoint[] => [
  { id: 1, name: "Gedung Vokasi UB (Lt. 2)" },
  { id: 2, name: "Kantin Vokasi UB" },
  { id: 3, name: "Gazebo Fakultas Ilmu Komputer" },
];

/**
 * Daftar jenis usaha contoh.
 * @returns daftar jenis usaha
 */
export const merchantTypes = (): MerchantType[] => [
  { id: 1, name: "Katering Nasi Box & Harian" },
  { id: 2, name: "Kudapan, Snack & Kue" },
  { id: 3, name: "Kedai Minuman & Es" },
  { id: 4, name: "Paket Custom & Prasmanan Acara" },
  { id: 5, name: "Danus Organisasi Mahasiswa" },
];
