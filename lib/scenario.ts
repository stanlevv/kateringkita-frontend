import "server-only";

// Skenario pratinjau (/pratinjau, hanya mode pengembangan): memaksa keadaan tertentu seperti data kosong
// atau gagal memuat, agar tampilan tiap keadaan bisa dicek tanpa mengubah backend.

import { cookies } from "next/headers";

/** Nama cookie tempat skenario aktif disimpan. */
export const SCENARIO_COOKIE = "kk_skenario";

/** Daftar skenario yang bisa dipilih, dengan label dan penjelasan singkat. */
export const SCENARIOS = [
  { id: "kosong", label: "Data kosong", description: "Belum ada pesanan, ulasan, atau promo; angka dashboard nol." },
  { id: "gagal-muat", label: "Gagal memuat", description: "Semua data gagal dimuat dengan pesan kesalahan." },
  {
    id: "gagal-aksi",
    label: "Aksi gagal",
    description: "Setiap tombol aksi (konfirmasi, simpan) gagal dan menampilkan pesan.",
  },
  { id: "dapur-tutup", label: "Dapur tutup", description: "Status dapur Tutup; pembeli tidak bisa memesan." },
  { id: "luar-jam", label: "Di luar jam buka", description: "Waktu sekarang di luar jam buka toko." },
  { id: "pesanan-baru", label: "Pesanan baru masuk", description: "Ada satu pesanan baru yang menunggu konfirmasi." },
  { id: "stok-bentrok", label: "Stok bentrok", description: "Konfirmasi pesanan ditolak karena stok tidak cukup." },
  { id: "penjual-baru", label: "Penjual baru", description: "Belum ada menu, titik temu, atau pesanan." },
  {
    id: "status-berubah",
    label: "Status berubah",
    description: "Status pesanan sudah berubah di perangkat lain saat aksi dikirim.",
  },
  {
    id: "gagal-sinkron",
    label: "Gagal menyegarkan",
    description: "Data awal tampil, tetapi pembaruan antrean selalu gagal; muncul pita koneksi terputus.",
  },
  { id: "konflik", label: "Data bentrok", description: "Simpan ditolak karena data sudah diubah di tempat lain." },
] as const;

/** Id skenario yang sah. */
export type Scenario = (typeof SCENARIOS)[number]["id"];

const SCENARIO_IDS: readonly string[] = SCENARIOS.map((scenario) => scenario.id);

/**
 * Mengecek apakah sebuah teks adalah id skenario yang dikenal.
 * @param value teks yang dicek
 * @returns true bila id skenario dikenal
 */
export function isScenario(value: string | null | undefined): value is Scenario {
  return !!value && SCENARIO_IDS.includes(value);
}

/**
 * Membaca skenario aktif dari cookie. Selalu null di production, jadi pengguna sungguhan tidak pernah terkena.
 * @returns id skenario, atau null bila tidak ada
 */
export async function getScenario(): Promise<Scenario | null> {
  if (process.env.NODE_ENV === "production") return null;
  const value = (await cookies()).get(SCENARIO_COOKIE)?.value;
  return isScenario(value) ? value : null;
}
