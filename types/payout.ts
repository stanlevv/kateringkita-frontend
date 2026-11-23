// Bentuk data pencairan dana penjual dari backend (GET /merchant/payouts, /admin/payouts, /admin/refunds).
// Pencairan = admin mentransfer uang hasil penjualan online ke rekening penjual.

/** Bank atau dompet digital yang bisa dipilih sebagai rekening tujuan. */
export type PayoutBank = { code: string; name: string };

/** Rekening penjual untuk menerima pencairan. */
export type BankAccount = {
  bank: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  updated_at: string;
};

/** Satu catatan pencairan yang sudah ditransfer admin. */
export type Payout = {
  id: number;
  merchant_id: number;
  business_name: string;
  amount: number;
  orders_count: number;
  bank: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  reference: string;
  note: string | null;
  admin_name: string | null;
  created_at: string;
};

/**
 * Data halaman pencairan milik penjual: daftar bank, rekening, saldo yang belum dicairkan, dan riwayat pencairan.
 */
export type MyPayouts = {
  banks: PayoutBank[];
  account: BankAccount | null;
  balance: { amount: number; orders: number; since: string | null };
  payouts: Payout[];
};

/**
 * Saldo satu toko yang menunggu dicairkan. `platform_discount` = total voucher platform di pesanan saldo ini; bisa kosong bila backend versi lama belum mengirimnya.
 */
export type MerchantBalance = {
  merchant_id: number;
  business_name: string;
  account: BankAccount | null;
  amount: number;
  orders: number;
  platform_discount?: number;
  since: string;
};
/**
 * Daftar saldo semua toko. `as_of` dikirim balik sebagai `until` saat admin mencatat pencairan, agar yang dicairkan sama dengan yang dilihat.
 */
export type BalanceList = { as_of: string; rows: MerchantBalance[] };

/** Riwayat pencairan per halaman. */
export type PayoutHistory = { data: Payout[]; meta: { page: number; limit: number; total: number } };

/** Pesanan yang sudah dibayar online tetapi batal, sehingga uangnya harus dikembalikan ke pembeli. */
export type PendingRefund = {
  code: string;
  status: "cancelled" | "expired";
  customer_name: string;
  customer_phone: string | null;
  business_name: string;
  dine_in: boolean;
  method: "va" | "online" | "qris";
  amount: number;
  paid_at: string;
  cancelled_at: string | null;
  cancelled_by: "customer" | "merchant" | "system" | null;
  cancel_reason: string | null;
};
