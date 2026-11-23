import "server-only";

// Data laporan penjualan dari backend (GET /merchant/reports/...): ringkasan, per jam, dan transaksi.
// Skenario /pratinjau (hanya mode pengembangan) bisa memaksa hasil kosong atau gagal tanpa memanggil backend.
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { ApiError, DataResult } from "@/types/api";
import type { HourlyPoint, ReportSummary, Transaction } from "@/types/report";

/** Rentang laporan, tanggal YYYY-MM-DD dalam WIB. */
export type ReportRange = { from: string; to: string }; // YYYY-MM-DD, WIB

// Hasil galat dan ringkasan nol yang dipakai bila skenario /pratinjau memaksa gagal atau kosong.
const LOAD_FAILED: { error: ApiError } = {
  error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." },
};
const EMPTY_SUMMARY: ReportSummary = { target: 0, revenue: 0, hpp_total: 0, profit: 0, achievement_pct: 0, orders: 0 };

/** Jalankan `ambil` kecuali skenario memaksa gagal/kosong (tanpa memanggil API). */
async function withScenario<T>(emptyData: T, fetchData: () => Promise<DataResult<T>>): Promise<DataResult<T>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return LOAD_FAILED;
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: emptyData };
  return fetchData();
}

const toQuery = (params: Record<string, string>) => new URLSearchParams(params).toString();

/**
 * Mengambil ringkasan laporan untuk rentang tanggal.
 * @param range tanggal `from` dan `to`
 * @returns `{ data }` atau `{ error }`
 */
export const getReportSummary = ({ from, to }: ReportRange) =>
  withScenario(EMPTY_SUMMARY, async () =>
    toResult(await merchantFetch<ReportSummary>(`/reports/summary?${toQuery({ from, to })}`)),
  );

/**
 * Mengambil angka penjualan per jam untuk satu tanggal.
 * @param query tanggal (`date`, YYYY-MM-DD)
 * @returns `{ data }` atau `{ error }`
 */
export const getHourly = ({ date }: { date: string }) =>
  withScenario<HourlyPoint[]>([], async () =>
    toResult(await merchantFetch<HourlyPoint[]>(`/reports/hourly?${toQuery({ date })}`)),
  );

/**
 * Mengambil transaksi selesai dalam rentang tanggal.
 * @param range tanggal `from` dan `to`
 * @returns `{ data }` atau `{ error }`
 */
export const getTransactions = ({ from, to }: ReportRange) =>
  withScenario<Transaction[]>([], async () =>
    toResult(await merchantFetch<Transaction[]>(`/reports/transactions?${toQuery({ from, to })}`)),
  );
