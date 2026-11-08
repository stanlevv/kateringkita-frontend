export type Promo = {
  id: number;
  code: string;
  description: string | null;
  type: "percent" | "fixed" | "free_service_fee";
  value: number;
  max_discount: number | null;
  min_subtotal: number;
  quota: number | null;
  used_count: number;
  per_user_limit: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};
