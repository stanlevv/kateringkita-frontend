// Bentuk data promo/voucher penjual dari backend (GET /merchant/promos).

/** Satu voucher. `is_public` true = tampil di halaman toko dan bisa diklaim; false = kode rahasia. */
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
  /** Voucher tampil di halaman toko / daftar voucher & bisa diklaim (false = kode rahasia). */
  is_public: boolean;
};
