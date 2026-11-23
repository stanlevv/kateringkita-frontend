import { describePromoType } from "@/lib/promo-status";
import type { VoucherOption } from "@/types/banner";
import type { Promo } from "@/types/promo";

/** Voucher yang layak jadi tujuan banner / pop-up: aktif, tampil (is_public), belum berakhir. */
export const voucherOptions = (promos: Promo[], now: number): VoucherOption[] =>
  promos
    .filter((promo) => promo.is_active && promo.is_public !== false && Date.parse(promo.ends_at) > now)
    .map((promo) => ({ id: promo.id, code: promo.code, label: describePromoType(promo) }));
