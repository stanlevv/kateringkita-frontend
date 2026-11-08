import type { Category } from "@/types/meta";

export type MenuOption = { id: number; name: string; extra_price: number };

export type MerchantMenu = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category: Category;
  unit_label: string;
  price: number;
  hpp: number;
  margin: number; // price - hpp
  daily_quota: number;
  quota_today: number;
  sold_today: number;
  held_today: number;
  available: number;
  prep_minutes: number;
  is_preorder: boolean;
  preorder_days: number;
  min_order_qty: number;
  is_active: boolean;
  options: MenuOption[];
  rating_avg: number;
  rating_count: number;
};
