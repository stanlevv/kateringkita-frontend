import type { Category, MerchantType, PickupPoint } from "@/types/meta";

// Salinan seed docs/schema.sql.
export const categories = (): Category[] => [
  { id: 1, name: "Nasi Box", slug: "nasi-box" },
  { id: 2, name: "Ayam", slug: "ayam" },
  { id: 3, name: "Martabak", slug: "martabak" },
  { id: 4, name: "Snack & Kue", slug: "snack" },
  { id: 5, name: "Minuman", slug: "minuman" },
  { id: 6, name: "Paket Acara", slug: "paket-acara" },
  { id: 7, name: "Danusan", slug: "danusan" },
];

export const pickupPoints = (): PickupPoint[] => [
  { id: 1, name: "Gedung Vokasi UB (Lt. 2)" },
  { id: 2, name: "Kantin Vokasi UB" },
  { id: 3, name: "Gazebo Fakultas Ilmu Komputer" },
];

export const merchantTypes = (): MerchantType[] => [
  { id: 1, name: "Katering Nasi Box & Harian" },
  { id: 2, name: "Kudapan, Snack & Kue" },
  { id: 3, name: "Kedai Minuman & Es" },
  { id: 4, name: "Paket Custom & Prasmanan Acara" },
  { id: 5, name: "Danus Organisasi Mahasiswa" },
];
