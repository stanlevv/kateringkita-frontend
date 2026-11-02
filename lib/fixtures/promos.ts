import type { Promo } from "../types";
import { hariLagi, hariLalu } from "./waktu";

// Empat status tampilan: berjalan, terjadwal, berakhir, nonaktif.
export const promos = (): Promo[] => [
  { id: 1, code: "HEMAT10", description: "Diskon 10% semua menu", type: "percent", value: 10, max_discount: 10000, min_subtotal: 30000, quota: 100, used_count: 37, per_user_limit: 1, starts_at: hariLalu(5), ends_at: hariLagi(10), is_active: true },
  { id: 2, code: "SARAPAN5K", description: "Potongan Rp 5.000 untuk sarapan", type: "fixed", value: 5000, max_discount: null, min_subtotal: 25000, quota: null, used_count: 0, per_user_limit: 2, starts_at: hariLagi(3), ends_at: hariLagi(17), is_active: true },
  { id: 3, code: "AKHIRBULAN", description: "Diskon 15% akhir bulan", type: "percent", value: 15, max_discount: 15000, min_subtotal: 50000, quota: 50, used_count: 50, per_user_limit: 1, starts_at: hariLalu(20), ends_at: hariLalu(2), is_active: true },
  { id: 4, code: "GRATISBIAYA", description: "Gratis biaya layanan", type: "free_service_fee", value: 0, max_discount: null, min_subtotal: 0, quota: 200, used_count: 12, per_user_limit: 1, starts_at: hariLalu(3), ends_at: hariLagi(25), is_active: false },
];
