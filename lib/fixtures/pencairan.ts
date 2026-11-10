import type { PencairanSaya } from "@/types/pencairan";

// F26: data contoh GET /merchant/payouts (rekening terisi, satu pencairan)
export const pencairanSaya = (): PencairanSaya => ({
  banks: [{ code: "bca", name: "BCA" }, { code: "bri", name: "BRI" }, { code: "dana", name: "DANA" }],
  account: { bank: "bca", bank_name: "BCA", account_number: "0123456789", account_name: "Diego Pratama", updated_at: "2026-11-01T02:00:00.000Z" },
  balance: { amount: 58_000, orders: 3, since: "2026-11-02T03:00:00.000Z" },
  payouts: [{
    id: 1, merchant_id: 1, business_name: "Dapur Diego", amount: 120_000, orders_count: 6, bank: "bca", bank_name: "BCA",
    account_number: "0123456789", account_name: "Diego Pratama", reference: "TRF-0001", note: null, admin_name: "Admin", created_at: "2026-11-01T09:00:00.000Z",
  }],
});
