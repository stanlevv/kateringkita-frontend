import { formatTime, formatRupiah } from "./format";
import type { MerchantOrder, PaymentMethod } from "@/types/order";

export const MAX_TEMPLATE_LENGTH = 1000;

export const PLACEHOLDER = [
  { code: "{kode}", description: "Kode pesanan" },
  { code: "{nama}", description: "Nama pembeli" },
  { code: "{menu}", description: "Daftar menu yang dipesan" },
  { code: "{total}", description: "Total bayar" },
  { code: "{titik_temu}", description: "Tempat pengambilan" },
  { code: "{waktu_ambil}", description: "Jam pengambilan" },
  { code: "{metode_bayar}", description: "Cara pembayaran" },
] as const;

export const TEMPLATE_BAWAAN = `Halo {nama}, pesanan {kode} sudah kami terima.

Menu: {menu}
Total: {total}
Cara bayar: {metode_bayar}
Ambil di: {titik_temu}
Waktu ambil: {waktu_ambil}

Terima kasih sudah memesan.`;

/** Nilai pengganti per placeholder, kunci tanpa kurung kurawal. */
export type TemplateValues = Record<string, string>;

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  qris: "QRIS toko",
  va: "Virtual Account",
  cod: "Tunai",
  online: "Bayar online",
};

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

/** Placeholder dikenal diganti; yang tidak dikenal dibiarkan apa adanya. */
export function renderTemplate(text: string, values: TemplateValues): string {
  return text.replace(PLACEHOLDER_PATTERN, (placeholder) => values[placeholder.slice(1, -1)] ?? placeholder);
}

const KNOWN_PLACEHOLDERS: readonly string[] = PLACEHOLDER.map((placeholder) => placeholder.code);

export function findUnknownPlaceholders(text: string): string[] {
  return [
    ...new Set(
      (text.match(PLACEHOLDER_PATTERN) ?? []).filter((placeholder) => !KNOWN_PLACEHOLDERS.includes(placeholder)),
    ),
  ];
}

/** Pesan galat pertama untuk templat, atau null bila valid (WA-E1, WA-E2). */
export function validateTemplate(text: string): string | null {
  if (text.trim() === "") return "Templat tidak boleh kosong.";
  if (text.length > MAX_TEMPLATE_LENGTH)
    return `Templat maksimal ${MAX_TEMPLATE_LENGTH.toLocaleString("id-ID")} karakter.`;
  const unknownPlaceholders = findUnknownPlaceholders(text);
  if (unknownPlaceholders.length > 0) return `Kata kunci ${unknownPlaceholders.join(", ")} tidak dikenal.`;
  return null;
}
