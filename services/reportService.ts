import "server-only";
import { hasil, merchantFetch } from "@/services/api";
import { getSkenario } from "@/lib/skenario";
import type { ApiError, DataResult } from "@/types/api";
import type { HourlyPoint, ReportSummary, Transaction } from "@/types/report";

export type RentangLaporan = { from: string; to: string }; // YYYY-MM-DD, WIB

// Skenario /pratinjau (hanya dev) ditumpuk di atas data sungguhan, seperti getOrders (F07 D16).
const GAGAL_MUAT: { error: ApiError } = { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
const NOL: ReportSummary = { target: 0, revenue: 0, hpp_total: 0, profit: 0, achievement_pct: 0, orders: 0 };

/** Jalankan `ambil` kecuali skenario memaksa gagal/kosong (tanpa memanggil API). */
async function laporan<T>(kosong: T, ambil: () => Promise<DataResult<T>>): Promise<DataResult<T>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return GAGAL_MUAT;
  if (s === "kosong" || s === "penjual-baru") return { data: kosong };
  return ambil();
}

const qs = (o: Record<string, string>) => new URLSearchParams(o).toString();

export const getReportSummary = ({ from, to }: RentangLaporan) =>
  laporan(NOL, async () => hasil(await merchantFetch<ReportSummary>(`/reports/summary?${qs({ from, to })}`)));

export const getHourly = ({ date }: { date: string }) =>
  laporan<HourlyPoint[]>([], async () => hasil(await merchantFetch<HourlyPoint[]>(`/reports/hourly?${qs({ date })}`)));

export const getTransactions = ({ from, to }: RentangLaporan) =>
  laporan<Transaction[]>([], async () => hasil(await merchantFetch<Transaction[]>(`/reports/transactions?${qs({ from, to })}`)));
