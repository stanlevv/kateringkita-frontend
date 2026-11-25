// Konstanta, tipe, dan helper murni formulir menu: label galat, isi formulir, isi awal, dan pembanding perubahan.
// Dipakai MenuForm.tsx.
import type { MerchantMenu } from "@/types/menu";
import type { OptionRow } from "./OptionsEditor";

export const MEGABYTE = 1024 * 1024;
/** Teks isian menjadi angka; isian kosong menjadi NaN supaya validasi menganggapnya belum diisi. */
export const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));
/** Nama isian untuk ringkasan galat (kunci = nama field API). */
const FIELD_LABELS: Record<string, string> = {
  image_url: "Foto",
  gallery: "Foto tambahan",
  name: "Nama menu",
  category_id: "Kategori",
  description: "Deskripsi",
  unit_label: "Satuan",
  price: "Harga jual",
  hpp: "HPP",
  daily_quota: "Kuota harian",
  prep_minutes: "Estimasi siap",
  min_order_qty: "Minimum pesan",
  preorder_days: "Hari pre-order",
};
/** Nama isian untuk ringkasan galat; galat opsi ditulis "Opsi N". */
export const fieldLabel = (fieldKey: string) => {
  const match = /^options\.(\d+)\./.exec(fieldKey);
  return match ? `Opsi ${Number(match[1]) + 1}` : (FIELD_LABELS[fieldKey] ?? fieldKey);
};

/** Isi formulir; angka disimpan sebagai teks isian dan baru diubah ke angka saat validasi/kirim. */
export type FormValues = {
  name: string;
  category_id: string;
  description: string;
  unit_label: string;
  price: string;
  hpp: string;
  daily_quota: string;
  prep_minutes: string;
  is_preorder: boolean;
  preorder_days: string;
  min_order_qty: string;
  options: OptionRow[];
};
/** Unggahan foto utama: berkas, pratinjau lokal, dan statusnya (mengunggah, gagal, selesai). */
export type PhotoUpload = { file: File; preview: string; status: "mengunggah" | "gagal" | "selesai"; message?: string };

// Isi formulir sebagai teks untuk membandingkan dengan isi awal. Tanda `touched` di opsi tidak ikut, karena itu
// hanya tanda tampilan, bukan perubahan data.
export const serialize = (values: FormValues) =>
  JSON.stringify({ ...values, options: values.options.map((option) => [option.name, option.extra_price]) });

/** Isi awal: dari menu (mode ubah), dari prefill Kalkulator HPP, atau nilai bawaan. */
export const initialValues = (
  menu: MerchantMenu | undefined,
  prefill: { hpp?: number; price?: number } | undefined,
): FormValues => ({
  name: menu?.name ?? "",
  category_id: menu ? String(menu.category.id) : "",
  description: menu?.description ?? "",
  unit_label: menu?.unit_label ?? "porsi",
  price: String(menu?.price ?? prefill?.price ?? ""),
  hpp: String(menu?.hpp ?? prefill?.hpp ?? ""),
  daily_quota: String(menu?.daily_quota ?? 20),
  prep_minutes: String(menu?.prep_minutes ?? 15),
  is_preorder: menu?.is_preorder ?? false,
  preorder_days: String(menu?.is_preorder ? menu.preorder_days : 1),
  min_order_qty: String(menu?.min_order_qty ?? 1),
  options: (menu?.options ?? []).map((option, index) => ({
    id: index,
    name: option.name,
    extra_price: String(option.extra_price),
    touched: false,
  })),
});
