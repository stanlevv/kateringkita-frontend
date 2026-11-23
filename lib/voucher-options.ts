// Pilihan voucher untuk form banner dan pop-up.

import { describePromoType } from "@/lib/promo-status";
import type { VoucherOption } from "@/types/banner";
import type { Promo } from "@/types/promo";

/**
 * Mengambil voucher yang layak jadi tujuan banner/pop-up: aktif, tampil ke publik, dan belum berakhir.
 * @param promos semua voucher
 * @param now waktu sekarang dalam milidetik
 * @returns pilihan berisi id, kode, dan label jenis potongan
 */
export const voucherOptions = (promos: Promo[], now: number): VoucherOption[] =>
  promos
    .filter((promo) => promo.is_active && promo.is_public !== false && Date.parse(promo.ends_at) > now)
    .map((promo) => ({ id: promo.id, code: promo.code, label: describePromoType(promo) }));
