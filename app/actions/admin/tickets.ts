"use server";

import { errorResult, fieldErrorResult } from "@/lib/action-result";
import { MAX_REPLY_LENGTH, isValidTicketCode } from "@/services/admin-ticket.service";
import { adminFetch, toResult } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

// Tiket bantuan: semua tingkat admin (super, ops, support) boleh membalas dan menutup. Backend tetap penjaga utamanya.
const ticketPath = (code: string, action: "messages" | "close") => `/tickets/${encodeURIComponent(code)}/${action}`;

/** Balasan 1–2000 karakter setelah dipangkas. Tiket yang sudah ditutup ditolak backend (409 TICKET_CLOSED). */
export async function replyToTicket(code: string, body: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!isValidTicketCode(code)) return errorResult("VALIDATION_ERROR", "Tiket tidak valid.");
  const trimmedBody = typeof body === "string" ? body.trim() : "";
  if (trimmedBody.length < 1 || trimmedBody.length > MAX_REPLY_LENGTH)
    return fieldErrorResult({ body: `Pesan 1–${MAX_REPLY_LENGTH} karakter.` }, "Periksa kembali balasan.");
  const response = await adminFetch<null>(ticketPath(code, "messages"), {
    method: "POST",
    body: JSON.stringify({ body: trimmedBody }),
  });
  return response.ok ? { data: null } : toResult(response);
}

/** Tiket yang sudah ditutup tetap 200 dari backend (tanpa perubahan). */
export async function closeTicket(code: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!isValidTicketCode(code)) return errorResult("VALIDATION_ERROR", "Tiket tidak valid.");
  const response = await adminFetch<null>(ticketPath(code, "close"), { method: "POST" });
  return response.ok ? { data: null } : toResult(response);
}
