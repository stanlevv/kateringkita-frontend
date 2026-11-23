"use server";

// Server action tiket bantuan: admin membalas dan menutup tiket keluhan pengguna. Semua tingkat admin (super, ops, support) boleh.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur: halaman/form -> server action (file ini) -> services/api.ts -> backend. Backend tetap pemeriksa utama izinnya.

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { MAX_REPLY_LENGTH, isValidTicketCode } from "@/services/admin-ticket.service";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

// Path API aksi tiket; kode tiket di-encode agar tidak bisa membelokkan path.
const ticketPath = (code: string, action: "messages" | "close") => `/tickets/${encodeURIComponent(code)}/${action}`;

/**
 * Mengirim balasan admin ke tiket (POST /admin/tickets/:code/messages).
 * @param code kode tiket (huruf, angka, dan tanda hubung, maksimal 20 karakter)
 * @param body isi balasan, 1–2000 karakter setelah dirapikan
 * @returns `{ data: null }` bila terkirim; `{ error }` bila kode tidak valid, balasan kosong atau terlalu panjang (pesan di field `body`),
 *   atau backend menolak (mis. 409 TICKET_CLOSED bila tiket sudah ditutup)
 */
export async function replyToTicket(code: string, body: string): Promise<ActionResult<null>> {
  // 1. Wajib admin; kode tiket harus valid.
  await requireAdmin();
  if (!isValidTicketCode(code)) return errorResult("VALIDATION_ERROR", "Tiket tidak valid.");
  // 2. Balasan dirapikan dan dicek panjangnya.
  const trimmedBody = typeof body === "string" ? body.trim() : "";
  if (trimmedBody.length < 1 || trimmedBody.length > MAX_REPLY_LENGTH)
    return fieldErrorResult({ body: `Pesan 1–${MAX_REPLY_LENGTH} karakter.` }, "Periksa kembali balasan.");
  // 3. Kirim ke backend.
  const response = await adminFetch<null>(ticketPath(code, "messages"), {
    method: "POST",
    body: JSON.stringify({ body: trimmedBody }),
  });
  return response.ok ? { data: null } : toResult(response);
}

/**
 * Menutup tiket (POST /admin/tickets/:code/close). Tiket yang sudah ditutup tetap dijawab sukses oleh backend (tanpa perubahan).
 * @param code kode tiket
 * @returns `{ data: null }` bila berhasil; `{ error }` bila kode tidak valid atau backend menolak (mis. tiket tidak ditemukan)
 */
export async function closeTicket(code: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!isValidTicketCode(code)) return errorResult("VALIDATION_ERROR", "Tiket tidak valid.");
  const response = await adminFetch<null>(ticketPath(code, "close"), { method: "POST" });
  return response.ok ? { data: null } : toResult(response);
}
