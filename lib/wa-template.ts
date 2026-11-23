// Templat pesan WhatsApp ke pembeli: daftar placeholder, templat bawaan, pengisian, dan validasi.

import { formatTime, formatRupiah } from "./format";
import type { MerchantOrder, PaymentMethod } from "@/types/order";

/** Panjang templat paling banyak (karakter). */
export const MAX_TEMPLATE_LENGTH = 1000;

/** Placeholder yang boleh dipakai di templat beserta penjelasannya. */
export const PLACEHOLDER = [
  { code: "{kode}", description: "Kode pesanan" },
  { code: "{nama}", description: "Nama pembeli" },
  { code: "{menu}", description: "Daftar menu yang dipesan" },
  { code: "{total}", description: "Total bayar" },
  { code: "{titik_temu}", description: "Tempat pengambilan" },
  { code: "{waktu_ambil}", description: "Jam pengambilan" },
  { code: "{metode_bayar}", description: "Cara pembayaran" },
] as const;

/**
 * Templat bawaan bila penjual belum menulis sendiri.
 * Nama dan isinya dibaca test backend lewat regex (harus sama persis dengan templat di backend), jadi jangan diubah.
 */
export const TEMPLATE_BAWAAN = `Halo {nama}, pesanan {kode} sudah kami terima.

Menu: {menu}
Total: {total}
Cara bayar: {metode_bayar}
Ambil di: {titik_temu}
Waktu ambil: {waktu_ambil}

Terima kasih sudah memesan.`;

/** Nilai pengganti per placeholder; kuncinya nama placeholder tanpa kurung kurawal. */
export type TemplateValues = Record<string, string>;

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  qris: "QRIS toko",
  va: "Virtual Account",
  cod: "Tunai",
  online: "Bayar online",
};

/**
 * Mengisi nilai placeholder dari data pesanan (kode, nama, menu, total, tempat ambil, waktu ambil, cara bayar).
 * @param order pesanan
 */
export function templateValuesFromOrder(order: MerchantOrder): TemplateValues {
  return {
    kode: order.code,
    nama: order.customer_name,
    menu: order.items.map((item) => `${item.qty}x ${item.menu_name}`).join(", "),
    total: formatRupiah(order.total),
    titik_temu: order.pickup_point?.name ?? (order.table ? `Meja ${order.table.label}` : "-"),
    waktu_ambil: order.pickup_at ? `${formatTime(order.pickup_at)} WIB` : "Secepatnya",
    metode_bayar: PAYMENT_LABELS[order.payment_method],
  };
}

const PLACEHOLDER_PATTERN = /\{[^{}\n]+\}/g;

/**
 * Mengganti placeholder yang dikenal dengan nilainya; placeholder tidak dikenal dibiarkan apa adanya.
 * @param text templat
 * @param values nilai pengganti
 */
export function renderTemplate(text: string, values: TemplateValues): string {
  return text.replace(PLACEHOLDER_PATTERN, (placeholder) => values[placeholder.slice(1, -1)] ?? placeholder);
}

const KNOWN_PLACEHOLDERS: readonly string[] = PLACEHOLDER.map((placeholder) => placeholder.code);

/**
 * Mencari placeholder di templat yang tidak dikenal (tanpa duplikat).
 * @param text templat
 */
export function findUnknownPlaceholders(text: string): string[] {
  return [
    ...new Set(
      (text.match(PLACEHOLDER_PATTERN) ?? []).filter((placeholder) => !KNOWN_PLACEHOLDERS.includes(placeholder)),
    ),
  ];
}

/**
 * Memeriksa templat: tidak kosong, tidak terlalu panjang, dan semua placeholder dikenal.
 * @param text templat
 * @returns pesan galat pertama, atau null bila valid
 */
export function validateTemplate(text: string): string | null {
  if (text.trim() === "") return "Templat tidak boleh kosong.";
  if (text.length > MAX_TEMPLATE_LENGTH)
    return `Templat maksimal ${MAX_TEMPLATE_LENGTH.toLocaleString("id-ID")} karakter.`;
  const unknownPlaceholders = findUnknownPlaceholders(text);
  if (unknownPlaceholders.length > 0) return `Kata kunci ${unknownPlaceholders.join(", ")} tidak dikenal.`;
  return null;
}
