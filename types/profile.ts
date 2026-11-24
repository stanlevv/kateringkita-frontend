// Bentuk data profil toko dari backend (GET /merchant/profile).

import type { MerchantType } from "@/types/meta";

/** Profil toko: identitas, jam buka, lama menahan pesanan, target omzet, templat WA, dan titik temu. */
export type MerchantProfile = {
  business_name: string;
  description: string | null;
  address: string;
  wa_number: string;
  logo_url: string | null;
  cover_url?: string | null; // background profil toko
  merchant_type: MerchantType;
  service_mode: "daily" | "event" | "both";
  is_open: boolean;
  open_time: string; // "HH:MM"
  close_time: string;
  hold_minutes: number;
  daily_revenue_target: number;
  wa_template: string | null;
  pickup_point_ids: number[];
  dine_in_enabled: boolean; // fitur pesan dari meja aktif atau tidak
};
