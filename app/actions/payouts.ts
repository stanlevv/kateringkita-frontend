"use server";

import { adminFetch, toResult, merchantFetch } from "@/services/api";
import { requireAdmin, requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Payout, MyPayouts } from "@/types/payout";

// F26 pencairan dana. Validasi isi (dan cek ulang kata sandi) ada di backend; aksi ini hanya meneruskan field yang dikenal.
const asObject = (value: unknown) =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

// ---- penjual ----
export async function saveBankAccount(input: unknown): Promise<ActionResult<MyPayouts>> {
  await requireMerchant();
  const { bank, account_number, account_name, password } = asObject(input);
  return toResult(
    await merchantFetch<MyPayouts>("/payout-account", {
      method: "PUT",
      body: JSON.stringify({ bank, account_number, account_name, password }),
    }),
  );
}

// ---- admin super ----
/** `until` = as_of daftar saldo yang sedang dilihat, `account_updated_at` = versi rekening yang tampil;
 *  saldo atau rekening yang berubah sejak itu ditolak backend (409). */
export async function recordPayout(input: unknown): Promise<ActionResult<Payout>> {
  await requireAdmin("super");
  const { merchant_id, amount, until, reference, note, account_updated_at } = asObject(input);
  return toResult(
    await adminFetch<Payout>("/payouts", {
      method: "POST",
      body: JSON.stringify({ merchant_id, amount, until, reference, note, account_updated_at }),
    }),
  );
}

export async function markRefundPaid(
  code: string,
  reference: string,
): Promise<ActionResult<{ code: string; amount: number; reference: string }>> {
  await requireAdmin("super");
  return toResult(
    await adminFetch<{ code: string; amount: number; reference: string }>(
      `/refunds/${encodeURIComponent(String(code))}`,
      {
        method: "POST",
        body: JSON.stringify({ reference }),
      },
    ),
  );
}
