// Bentuk data pop-up promo di aplikasi mobile (GET /admin/popups).

/** Satu pop-up promo: gambar, voucher tujuan, dan periode tayang. */
export type Popup = {
  id: number;
  title: string;
  image_url: string;
  promo: { id: number; code: string } | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
};

/** Isian form pop-up yang dikirim ke backend. */
export type PopupInput = {
  title: string;
  image_url: string;
  promo_id: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};
