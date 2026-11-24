"use server";

// Server action pencairan dana: penjual menyimpan rekening tujuan; admin super mencatat pencairan dan menandai refund sudah ditransfer.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.
// Validasi isi (dan cek ulang kata sandi) ada di backend.

import { adminFetch, toResult, merchantFetch } from "@/services/api";
import { requireAdmin, requireMerchant } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";
import type { Payout, MyPayouts } from "@/types/payout";

// Isian dari browser bisa berbentuk apa saja; selain objek dianggap objek kosong agar destrukturisasi tidak melempar.
const asObject = (value: unknown) =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

// ---- penjual ----

/**
 * Menyimpan rekening tujuan pencairan penjual (PUT /merchant/payout-account). Hanya field yang dikenal yang diteruskan.
 * @param input `bank`, `account_number`, `account_name`, dan `password` (kata sandi akun untuk konfirmasi)
 * @returns `{ data }` berisi data pencairan penjual terbaru; `{ error }` bila isian atau kata sandi salah (dari backend)
 */
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

/**
 * Mencatat pencairan dana ke penjual (POST /admin/payouts). Hanya admin super.
 * `until` = waktu `as_of` daftar saldo yang sedang dilihat admin, `account_updated_at` = versi rekening yang tampil;
 * bila saldo atau rekening sudah berubah sejak itu, backend menolak dengan 409 (konflik) agar admin tidak mencatat dengan data lama.
 * @param input `merchant_id`, `amount`, `until`, `reference` (nomor bukti transfer), `note`, `account_updated_at`
 * @returns `{ data }` berisi pencairan tercatat, atau `{ error }` dari backend
 */
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

/**
 * Menandai refund pesanan sudah ditransfer ke pembeli (POST /admin/refunds/:code). Hanya admin super.
 * @param code kode pesanan yang direfund
 * @param reference nomor bukti transfer refund
 * @returns `{ data: { code, amount, reference } }`, atau `{ error }` dari backend
 */
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
