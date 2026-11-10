"use server";

import { adminFetch, hasil, merchantFetch } from "@/services/api";
import { requireAdmin, requireMerchant } from "@/services/authService";
import type { ActionResult } from "@/types/api";
import type { Pencairan, PencairanSaya } from "@/types/pencairan";

// F26 pencairan dana. Validasi isi (dan cek ulang kata sandi) ada di backend; aksi ini hanya meneruskan field yang dikenal.
const objek = (v: unknown) => (typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {});

// ---- penjual ----
export async function saveRekening(input: unknown): Promise<ActionResult<PencairanSaya>> {
  await requireMerchant();
  const { bank, account_number, account_name, password } = objek(input);
  return hasil(await merchantFetch<PencairanSaya>("/payout-account", { method: "PUT", body: JSON.stringify({ bank, account_number, account_name, password }) }));
}

// ---- admin super ----
/** `until` = as_of daftar saldo yang sedang dilihat; saldo yang berubah sejak itu ditolak backend (409). */
export async function catatPencairan(input: unknown): Promise<ActionResult<Pencairan>> {
  await requireAdmin("super");
  const { merchant_id, amount, until, reference, note } = objek(input);
  return hasil(await adminFetch<Pencairan>("/payouts", { method: "POST", body: JSON.stringify({ merchant_id, amount, until, reference, note }) }));
}

export async function tandaiRefund(code: string, reference: string): Promise<ActionResult<{ code: string; amount: number; reference: string }>> {
  await requireAdmin("super");
  return hasil(await adminFetch<{ code: string; amount: number; reference: string }>(`/refunds/${encodeURIComponent(String(code))}`, {
    method: "POST", body: JSON.stringify({ reference }),
  }));
}
