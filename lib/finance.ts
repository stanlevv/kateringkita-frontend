// Pembuat file CSV rekap keuangan admin (dipakai route unduhan /api/admin/keuangan/csv).

import { csvCell } from "./report";
import type { FinanceSummary } from "@/types/admin";

// Kolom angka yang diambil dari tiap baris rekap, urut sesuai judul kolom CSV di bawah.
const CSV_COLUMNS = [
  "orders",
  "subtotal",
  "discount_merchant",
  "discount_platform",
  "service_fee",
  "total",
  "merchant_net",
  "platform_net",
] as const;

/**
 * Membuat isi CSV rekap keuangan: satu baris per toko ditambah baris TOTAL.
 * Angka rupiah ditulis tanpa format agar bisa langsung dihitung di spreadsheet.
 * @param summary rekap keuangan dari backend
 * @returns teks CSV dengan akhir baris CRLF
 */
export function createFinanceCsv(summary: FinanceSummary): string {
  const rows = [
    ...summary.rows.map((row) => [csvCell(row.business_name), ...CSV_COLUMNS.map((column) => row[column])]),
    ["TOTAL", ...CSV_COLUMNS.map((column) => summary.totals[column])],
  ];
  return (
    [
      "toko,pesanan,subtotal,diskon_toko,diskon_platform,biaya_layanan,total,pendapatan_toko,pendapatan_platform",
      ...rows.map((row) => row.join(",")),
    ].join("\r\n") + "\r\n"
  );
}
