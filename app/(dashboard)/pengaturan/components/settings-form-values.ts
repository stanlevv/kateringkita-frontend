// Konstanta dan helper murni formulir pengaturan toko: bagian halaman, mode layanan, label galat, dan konversi isi formulir.
// Dipakai SettingsForm.tsx.
import type { MerchantProfile } from "@/types/profile";

/** Bagian halaman; `id` juga dipakai sebagai #hash tautan dan nilai ?lengkapi=, jadi tidak boleh diganti. */
export const SECTIONS = [
  { id: "profil", title: "Profil toko" },
  { id: "operasional", title: "Operasional" },
  { id: "titik-temu", title: "Titik temu" },
  { id: "pembayaran", title: "Pembayaran & pencairan" },
  { id: "meja", title: "Pesan dari meja" },
  { id: "akun", title: "Akun" },
] as const;
/** Pilihan mode layanan (nilai = service_mode di API). */
export const SERVICE_MODES = [
  { value: "daily", label: "Harian", description: "Porsi satuan yang dijual setiap hari." },
  { value: "event", label: "Acara", description: "Pesanan besar yang dipesan lebih dulu." },
  { value: "both", label: "Keduanya", description: "Harian dan acara sekaligus." },
] as const;
/** Nama isian untuk ringkasan galat (kunci = nama field API). */
export const FIELD_LABELS: Record<string, string> = {
  business_name: "Nama usaha",
  description: "Deskripsi",
  address: "Alamat",
  wa_number: "Nomor WA toko",
  open_time: "Jam buka",
  close_time: "Jam tutup",
  hold_minutes: "Durasi tahan pesanan",
  logo_url: "Logo toko",
  cover_url: "Background toko",
  daily_revenue_target: "Target omzet harian",
  pickup_point_ids: "Titik temu",
};
/** Teks isian menjadi angka; isian kosong menjadi NaN supaya validasi menganggapnya belum diisi. */
export const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));

/** Isi formulir profil (kunci = nama field API); angka disimpan sebagai teks isian. */
export type ProfileFormValues = {
  business_name: string;
  description: string;
  address: string;
  wa_number: string;
  service_mode: MerchantProfile["service_mode"];
  open_time: string;
  close_time: string;
  hold_minutes: string;
  daily_revenue_target: string;
  pickup_point_ids: number[];
  logo_url: string | null;
  cover_url: string | null;
};

/** Isi formulir dari profil toko di backend. */
export const toFormValues = (merchantProfile: MerchantProfile): ProfileFormValues => ({
  business_name: merchantProfile.business_name,
  description: merchantProfile.description ?? "",
  address: merchantProfile.address,
  wa_number: merchantProfile.wa_number,
  service_mode: merchantProfile.service_mode,
  open_time: merchantProfile.open_time,
  close_time: merchantProfile.close_time,
  hold_minutes: String(merchantProfile.hold_minutes),
  daily_revenue_target: String(merchantProfile.daily_revenue_target),
  pickup_point_ids: merchantProfile.pickup_point_ids,
  logo_url: merchantProfile.logo_url,
  cover_url: merchantProfile.cover_url ?? null,
});
// Isi formulir sebagai teks untuk mendeteksi perubahan; urutan titik temu tidak dianggap perubahan.
export const compareKey = (values: ProfileFormValues) =>
  JSON.stringify({ ...values, pickup_point_ids: [...values.pickup_point_ids].sort((first, second) => first - second) });
