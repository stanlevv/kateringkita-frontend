import "server-only";
import { adminFetch, toResult, merchantFetch } from "@/services/api";
import type { BalanceList, Payout, MyPayouts, PendingRefund } from "@/types/payout";

// F26: rekening, saldo, dan riwayat pencairan milik penjual
export const getMyPayouts = async () => toResult(await merchantFetch<MyPayouts>("/payouts"));

// F26 admin super: saldo per toko, dana Midtrans yang harus dikembalikan, riwayat pencairan (meta = paginasi, 20 per halaman)
export const LIMIT_PAYOUTS = 20;
export const getMerchantBalances = async () => toResult(await adminFetch<BalanceList>("/payouts/balances"));
export const getPendingRefunds = async () => toResult(await adminFetch<PendingRefund[]>("/refunds"));
export const getPayoutHistory = (page: number) => adminFetch<Payout[]>(`/payouts?page=${page}`);
