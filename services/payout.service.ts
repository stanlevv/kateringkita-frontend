import "server-only";

// Data pencairan dana: halaman penjual (rekening, saldo, riwayat) dan halaman admin super (saldo per toko, refund, riwayat).
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { adminFetch, toResult, merchantFetch } from "@/services/api";
import type { BalanceList, Payout, MyPayouts, PendingRefund } from "@/types/payout";

/**
 * Mengambil data pencairan milik penjual yang login.
 * @returns `{ data }` atau `{ error }`
 */
export const getMyPayouts = async () => toResult(await merchantFetch<MyPayouts>("/payouts"));

/** Jumlah riwayat pencairan per halaman di panel admin. */
export const LIMIT_PAYOUTS = 20;
/**
 * Mengambil saldo setiap toko yang menunggu dicairkan.
 * @returns `{ data }` atau `{ error }`
 */
export const getMerchantBalances = async () => toResult(await adminFetch<BalanceList>("/payouts/balances"));
/**
 * Mengambil pesanan berbayar online yang batal dan uangnya harus dikembalikan ke pembeli.
 * @returns `{ data }` atau `{ error }`
 */
export const getPendingRefunds = async () => toResult(await adminFetch<PendingRefund[]>("/refunds"));
/**
 * Mengambil satu halaman riwayat pencairan.
 * @param page nomor halaman
 * @returns hasil mentah `ApiResult` (termasuk `meta` paginasi)
 */
export const getPayoutHistory = (page: number) => adminFetch<Payout[]>(`/payouts?page=${page}`);
