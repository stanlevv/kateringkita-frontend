// Tipe katalog publik (tanpa login): daftar toko, profil toko, dan kartu menu. Sesuai docs/API.md §4.

/** Satu toko di daftar GET /merchants. */
export type PublicMerchantSummary = {
  slug: string;
  business_name: string;
  logo_url: string | null;
  merchant_type: { id: number; name: string };
  rating_avg: number;
  rating_count: number;
};

/** Profil toko GET /merchants/:slug (tanpa alamat, WhatsApp, dan status verifikasi). */
export type MerchantProfile = {
  id: number;
  slug: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  merchant_type: { id: number; name: string };
  is_open: boolean;
  /** "HH:MM" WIB */
  open_time: string;
  /** "HH:MM" WIB */
  close_time: string;
  rating_avg: number;
  rating_count: number;
  pickup_points: { id: number; name: string; description: string | null }[];
};

/** Kartu menu GET /menus (tanpa hpp). */
export type MenuCard = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  unit_label: string;
  category: { id: number; name: string; slug: string };
  merchant: { id: number; slug: string; business_name: string; is_open: boolean };
  available: number;
  badge: "sold_out" | "preorder" | "low_stock" | "available";
  rating_avg: number;
  rating_count: number;
  is_favorite: boolean;
};
