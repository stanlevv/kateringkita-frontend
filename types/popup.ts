// Pop-up promo mobile (GET /admin/popups)
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

export type PopupInput = {
  title: string;
  image_url: string;
  promo_id: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};
