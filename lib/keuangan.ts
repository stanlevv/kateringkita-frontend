import { selCsv } from "./laporan";
import type { RekapKeuangan } from "@/types/admin";

// F20: CSV rekap keuangan per toko + baris total (angka rupiah tanpa format, siap dihitung di spreadsheet)
const KOLOM = ["orders", "subtotal", "discount_merchant", "discount_platform", "service_fee", "total", "merchant_net", "platform_net"] as const;

export function buatCsvKeuangan(r: RekapKeuangan): string {
  const baris = [...r.rows.map((x) => [selCsv(x.business_name), ...KOLOM.map((k) => x[k])]), ["TOTAL", ...KOLOM.map((k) => r.totals[k])]];
  return ["toko,pesanan,subtotal,diskon_toko,diskon_platform,biaya_layanan,total,pendapatan_toko,pendapatan_platform", ...baris.map((b) => b.join(","))]
    .join("\r\n") + "\r\n";
}
