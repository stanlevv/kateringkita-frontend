import type { MerchantProfile } from "../types";
import { merchantTypes } from "./meta";

export const profile = (): MerchantProfile => ({
  business_name: "Dapur Diego",
  description: "Katering nasi box dan kudapan harian untuk mahasiswa dan dosen Vokasi UB.",
  address: "Jl. Veteran No. 12, Malang",
  wa_number: "081234567890",
  logo_url: null,
  merchant_type: merchantTypes()[0],
  service_mode: "both",
  is_open: true,
  open_time: "07:00",
  close_time: "21:00",
  hold_minutes: 5,
  daily_revenue_target: 500_000,
  qris_image_url: null,
  wa_template: "Halo {nama}, pesanan {kode} sudah kami konfirmasi.",
  pickup_point_ids: [1, 2, 3],
});
