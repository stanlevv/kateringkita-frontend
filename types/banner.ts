// Bentuk data banner beranda aplikasi mobile (GET /merchant/banners dan /admin/banners).

/** Status persetujuan banner oleh admin. */
export type BannerStatus = "menunggu" | "disetujui" | "ditolak" | "nonaktif";

/**
 * Satu banner beranda: gambar, tujuan klik (voucher atau toko), periode tayang, dan status persetujuannya.
 */
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
  /** Waktu banner diarsipkan admin; null atau tidak ada bila tidak diarsipkan. */
  archived_at?: string | null;
};

/** Pilihan voucher di form banner/pop-up: id, kode, dan label yang dibaca manusia. */
export type VoucherOption = { id: number; code: string; label: string };
