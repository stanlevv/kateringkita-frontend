// F26 pencairan dana: bentuk sama dengan respons backend (GET /merchant/payouts, /admin/payouts*, /admin/refunds).
export type PayoutBank = { code: string; name: string };

export type BankAccount = {
  bank: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  updated_at: string;
};

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

export type MyPayouts = {
  banks: PayoutBank[];
  account: BankAccount | null;
  balance: { amount: number; orders: number; since: string | null };
  payouts: Payout[];
};

// as_of dikirim balik sebagai `until` saat mencatat pencairan
export type MerchantBalance = {
  merchant_id: number;
  business_name: string;
  account: BankAccount | null;
  amount: number;
  orders: number;
  /** AUD-25: total voucher platform di pesanan saldo ini; opsional selama backend lama belum mengirimnya */
  platform_discount?: number;
  since: string;
};
export type BalanceList = { as_of: string; rows: MerchantBalance[] };

export type PayoutHistory = { data: Payout[]; meta: { page: number; limit: number; total: number } };

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
