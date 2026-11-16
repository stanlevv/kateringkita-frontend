import { teksJenis } from "@/lib/promo-status";
import type { PilihanVoucher } from "@/types/banner";
import type { Promo } from "@/types/promo";

/** Voucher yang layak jadi tujuan banner / pop-up: aktif, tampil (is_public), belum berakhir. */
export const pilihanVoucher = (promos: Promo[], now: number): PilihanVoucher[] =>
  promos
    .filter((p) => p.is_active && p.is_public !== false && Date.parse(p.ends_at) > now)
    .map((p) => ({ id: p.id, code: p.code, label: teksJenis(p) }));
