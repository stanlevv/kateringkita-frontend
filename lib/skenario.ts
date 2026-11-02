import "server-only";
import { cookies } from "next/headers";

export const SKENARIO_COOKIE = "kk_skenario";

export const SKENARIO = [
  { id: "kosong", label: "Data kosong", deskripsi: "Belum ada pesanan, ulasan, atau promo; angka dashboard nol." },
  { id: "gagal-muat", label: "Gagal memuat", deskripsi: "Semua data gagal dimuat dengan pesan kesalahan." },
  { id: "gagal-aksi", label: "Aksi gagal", deskripsi: "Setiap tombol aksi (konfirmasi, simpan) gagal dan menampilkan pesan." },
  { id: "dapur-tutup", label: "Dapur tutup", deskripsi: "Status dapur Tutup; pembeli tidak bisa memesan." },
  { id: "luar-jam", label: "Di luar jam buka", deskripsi: "Waktu sekarang di luar jam buka toko." },
  { id: "pesanan-baru", label: "Pesanan baru masuk", deskripsi: "Ada satu pesanan baru yang menunggu konfirmasi." },
  { id: "stok-bentrok", label: "Stok bentrok", deskripsi: "Konfirmasi pesanan ditolak karena stok tidak cukup." },
  { id: "penjual-baru", label: "Penjual baru", deskripsi: "Belum ada menu, titik temu, atau pesanan." },
  { id: "status-berubah", label: "Status berubah", deskripsi: "Status pesanan sudah berubah di perangkat lain saat aksi dikirim." },
  { id: "gagal-sinkron", label: "Gagal menyegarkan", deskripsi: "Data awal tampil, tetapi pembaruan antrean selalu gagal; muncul pita koneksi terputus." },
  { id: "konflik", label: "Data bentrok", deskripsi: "Simpan ditolak karena data sudah diubah di tempat lain." },
] as const;

export type Skenario = (typeof SKENARIO)[number]["id"];

const IDS: readonly string[] = SKENARIO.map((s) => s.id);

export function isSkenario(v: string | null | undefined): v is Skenario {
  return !!v && IDS.includes(v);
}

/** Dibaca dari cookie; selalu null di production. */
export async function getSkenario(): Promise<Skenario | null> {
  if (process.env.NODE_ENV === "production") return null;
  const v = (await cookies()).get(SKENARIO_COOKIE)?.value;
  return isSkenario(v) ? v : null;
}
