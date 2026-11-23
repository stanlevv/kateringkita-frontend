import { csvCell } from "./report";
import type { FinanceSummary } from "@/types/admin";

// F20: CSV rekap keuangan per toko + baris total (angka rupiah tanpa format, siap dihitung di spreadsheet)
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
