// F26 pencairan dana: bentuk sama dengan respons backend (GET /merchant/payouts, /admin/payouts*, /admin/refunds).
export type BankPencairan = { code: string; name: string };

export type RekeningPencairan = { bank: string; bank_name: string; account_number: string; account_name: string; updated_at: string };

export type Pencairan = {
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

export type PencairanSaya = {
  banks: BankPencairan[];
  account: RekeningPencairan | null;
  balance: { amount: number; orders: number; since: string | null };
  payouts: Pencairan[];
};

// as_of dikirim balik sebagai `until` saat mencatat pencairan
export type SaldoPenjual = { merchant_id: number; business_name: string; account: RekeningPencairan | null; amount: number; orders: number; since: string };
export type DaftarSaldo = { as_of: string; rows: SaldoPenjual[] };

export type RiwayatPencairan = { data: Pencairan[]; meta: { page: number; limit: number; total: number } };

export type RefundMenunggu = {
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
