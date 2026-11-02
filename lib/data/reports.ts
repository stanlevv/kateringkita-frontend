import "server-only";
import { hourly, ringkasan, transaksi } from "../fixtures/reports";
import type { DataResult, HourlyPoint, ReportSummary, Transaction } from "../types";
import { baca, kosongkan } from "./baca";

export type RentangLaporan = { from: string; to: string }; // YYYY-MM-DD, WIB

// shortcut: data contoh sampai F09 (GET /merchant/reports/summary?from&to)
export async function getReportSummary({ from, to }: RentangLaporan): Promise<DataResult<ReportSummary>> {
  return baca((s) => {
    const r = ringkasan(from, to);
    return kosongkan(s) ? { ...r, revenue: 0, hpp_total: 0, profit: 0, achievement_pct: 0 } : r;
  });
}

// shortcut: data contoh sampai F09 (GET /merchant/reports/hourly?date)
export async function getHourly({ date }: { date: string }): Promise<DataResult<HourlyPoint[]>> {
  return baca((s) => (kosongkan(s) ? [] : hourly(date)));
}

// shortcut: data contoh sampai F09 (GET /merchant/reports/transactions?from&to)
export async function getTransactions({ from, to }: RentangLaporan): Promise<DataResult<Transaction[]>> {
  return baca((s) => (kosongkan(s) ? [] : transaksi(from, to)));
}
