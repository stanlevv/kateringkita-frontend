// Bentuk data ulasan pembeli dari backend (GET /merchant/reviews).

/** Satu ulasan: menu yang diulas, nama pembeli, bintang, dan komentar. */
export type Review = {
  id: number;
  menu_id: number;
  menu_name: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
