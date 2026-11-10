import type { MerchantType } from "@/types/meta";

export type MerchantProfile = {
  business_name: string;
  description: string | null;
  address: string;
  wa_number: string;
  logo_url: string | null;
  merchant_type: MerchantType;
  service_mode: "daily" | "event" | "both";
  is_open: boolean;
  open_time: string; // "HH:MM"
  close_time: string;
  hold_minutes: number;
  daily_revenue_target: number;
  wa_template: string | null;
  pickup_point_ids: number[];
  dine_in_enabled: boolean; // F21 pesan dari meja
};
