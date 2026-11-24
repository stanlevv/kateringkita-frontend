// Data pendukung umum dari backend (GET /meta/...): kategori, titik temu, jenis usaha, dan mode pemeliharaan.

/** Kategori menu. */
export type Category = { id: number; name: string; slug: string };
/** Titik temu, yaitu tempat pembeli mengambil pesanan. */
export type PickupPoint = { id: number; name: string };
/** Jenis usaha penjual. */
export type MerchantType = { id: number; name: string };
/** Status mode pemeliharaan dari admin: sedang aktif atau tidak, dan pesan untuk pengguna. */
export type Maintenance = { aktif: boolean; pesan: string | null };
