// Banner beranda mobile (GET /merchant/banners, GET /admin/banners)
export type BannerStatus = "menunggu" | "disetujui" | "ditolak" | "nonaktif";

export type Banner = {
  id: number;
  title: string;
  image_url: string;
  target: "promo" | "merchant" | "none";
  promo: { id: number; code: string } | null;
  merchant: { id: number; slug: string; business_name: string } | null;
  status: BannerStatus;
  catatan: string | null;
  starts_at: string;
  ends_at: string;
  sort_order: number;
  reviewed_at: string | null;
  created_at: string;
};

/** Pilihan voucher di form banner. */
export type VoucherOption = { id: number; code: string; label: string };
