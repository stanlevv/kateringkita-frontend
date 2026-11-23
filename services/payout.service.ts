import "server-only";
import { adminFetch, hasil, merchantFetch } from "@/services/api";
import type { DaftarSaldo, Pencairan, PencairanSaya, RefundMenunggu } from "@/types/pencairan";

// F26: rekening, saldo, dan riwayat pencairan milik penjual
export const getPencairanSaya = async () => hasil(await merchantFetch<PencairanSaya>("/payouts"));

// F26 admin super: saldo per toko, dana Midtrans yang harus dikembalikan, riwayat pencairan (meta = paginasi, 20 per halaman)
export const LIMIT_PENCAIRAN = 20;
export const getSaldoPenjual = async () => hasil(await adminFetch<DaftarSaldo>("/payouts/balances"));
export const getRefundMenunggu = async () => hasil(await adminFetch<RefundMenunggu[]>("/refunds"));
export const getRiwayatPencairan = (page: number) => adminFetch<Pencairan[]>(`/payouts?page=${page}`);
