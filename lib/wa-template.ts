import { formatJam, formatRupiah } from "./format";
import type { MerchantOrder, PaymentMethod } from "@/types/order";

export const MAKS_TEMPLATE = 1000;

export const PLACEHOLDER = [
  { kode: "{kode}", deskripsi: "Kode pesanan" },
  { kode: "{nama}", deskripsi: "Nama pembeli" },
  { kode: "{menu}", deskripsi: "Daftar menu yang dipesan" },
  { kode: "{total}", deskripsi: "Total bayar" },
  { kode: "{titik_temu}", deskripsi: "Tempat pengambilan" },
  { kode: "{waktu_ambil}", deskripsi: "Jam pengambilan" },
  { kode: "{metode_bayar}", deskripsi: "Cara pembayaran" },
] as const;

export const TEMPLATE_BAWAAN = `Halo {nama}, pesanan {kode} sudah kami terima.

Menu: {menu}
Total: {total}
Cara bayar: {metode_bayar}
Ambil di: {titik_temu}
Waktu ambil: {waktu_ambil}

Terima kasih sudah memesan.`;

/** Nilai pengganti per placeholder, kunci tanpa kurung kurawal. */
export type ContohPesanan = Record<string, string>;

const METODE: Record<PaymentMethod, string> = { qris: "QRIS", va: "Virtual Account", cod: "Tunai", online: "Bayar online" };

export function contohDariPesanan(o: MerchantOrder): ContohPesanan {
  return {
    kode: o.code,
    nama: o.customer_name,
    menu: o.items.map((i) => `${i.qty}x ${i.menu_name}`).join(", "),
    total: formatRupiah(o.total),
    titik_temu: o.pickup_point?.name ?? (o.table ? `Meja ${o.table.label}` : "-"),
    waktu_ambil: o.pickup_at ? `${formatJam(o.pickup_at)} WIB` : "Secepatnya",
    metode_bayar: METODE[o.payment_method],
  };
}

const KATA_KUNCI = /\{[^{}\n]+\}/g;

/** Placeholder dikenal diganti; yang tidak dikenal dibiarkan apa adanya. */
export function renderTemplate(text: string, contoh: ContohPesanan): string {
  return text.replace(KATA_KUNCI, (k) => contoh[k.slice(1, -1)] ?? k);
}

const DIKENAL: readonly string[] = PLACEHOLDER.map((p) => p.kode);

export function findUnknownPlaceholders(text: string): string[] {
  return [...new Set((text.match(KATA_KUNCI) ?? []).filter((k) => !DIKENAL.includes(k)))];
}

/** Pesan galat pertama untuk templat, atau null bila valid (WA-E1, WA-E2). */
export function cekTemplate(text: string): string | null {
  if (text.trim() === "") return "Templat tidak boleh kosong.";
  if (text.length > MAKS_TEMPLATE) return `Templat maksimal ${MAKS_TEMPLATE.toLocaleString("id-ID")} karakter.`;
  const asing = findUnknownPlaceholders(text);
  if (asing.length > 0) return `Kata kunci ${asing.join(", ")} tidak dikenal.`;
  return null;
}
