"use server";

// Server action chat pesanan penjual: kirim pesan, tandai dibaca, laporkan chat, dan minta alamat unggah foto chat.
// "use server" menandai fungsi di file ini sebagai server action: dipanggil dari komponen di browser, tetapi dijalankan di server Next.js.
// Posisi di alur (ubah data): panel chat -> server action (file ini) -> api.ts -> backend.

import { errorResult } from "@/lib/action-result";
import { toResult, merchantFetch } from "@/services/api";
import { requireMerchant } from "@/services/auth.service";
import type { ActionResult, ApiError } from "@/types/api";
import type { ChatMessage } from "@/types/order-chat";

const MESSAGE_LENGTH_MESSAGE = "Pesan 1–1000 karakter.";
const REASON_LENGTH_MESSAGE = "Alasan 5–500 karakter.";
/** Path API chat satu pesanan; kode dikodekan supaya tidak bisa menyusun path lain. */
const chatPath = (code: string, suffix: string) => `/orders/${encodeURIComponent(code)}/${suffix}`;
const invalidOrder = () => errorResult("VALIDATION_ERROR", "Data pesanan tidak valid.");

/**
 * Mengirim pesan penjual (POST /merchant/orders/:code/messages). Pesan berisi teks, foto, atau keduanya.
 * @param code kode pesanan
 * @param input `body` teks pesan (di-trim, 1–1000 karakter) dan/atau `image_url` alamat foto hasil unggah chat
 * @returns `{ data }` berisi pesan tersimpan; `{ error }` bila isi tidak sah atau backend menolak (mis. 409
 *   CHAT_CLOSED bila pesanan sudah selesai, 400 bila foto bukan dari folder chat pesanan ini, 429 terlalu sering)
 * @throws dialihkan ke halaman masuk (redirect Next.js) oleh requireMerchant bila sesi penjual tidak ada
 */
export async function sendChatMessage(
  code: string,
  input: { body?: string; image_url?: string },
): Promise<ActionResult<ChatMessage>> {
  // 1. Wajib login penjual; kode harus teks.
  await requireMerchant();
  if (typeof code !== "string") return invalidOrder();
  // 2. Teks di-trim; teks kosong dianggap tidak ada. Pesan wajib punya teks atau foto.
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  const imageUrl = typeof input?.image_url === "string" ? input.image_url : "";
  if ((!body && !imageUrl) || body.length > 1000) return errorResult("VALIDATION_ERROR", MESSAGE_LENGTH_MESSAGE);
  // 3. Kirim hanya kunci yang diisi; URL foto diperiksa backend terhadap folder chat pesanan ini.
  return toResult(
    await merchantFetch<ChatMessage>(chatPath(code, "messages"), {
      method: "POST",
      body: JSON.stringify({ ...(body ? { body } : {}), ...(imageUrl ? { image_url: imageUrl } : {}) }),
    }),
  );
}

/**
 * Menandai pesan pembeli sudah dibaca sampai `lastId` (POST /merchant/orders/:code/messages/read).
 * @param code kode pesanan
 * @param lastId id pesan pembeli terakhir yang benar-benar sudah tampil di layar
 * @returns `{ data: true }` bila tersimpan (backend menjawab 204 tanpa isi); `{ error }` bila data tidak sah atau
 *   backend menolak
 * @throws dialihkan ke halaman masuk (redirect Next.js) oleh requireMerchant bila sesi penjual tidak ada
 */
export async function markChatRead(code: string, lastId: number): Promise<ActionResult<true>> {
  await requireMerchant();
  if (typeof code !== "string" || !Number.isInteger(lastId) || lastId < 0) return invalidOrder();
  const response = await merchantFetch(chatPath(code, "messages/read"), {
    method: "POST",
    body: JSON.stringify({ last_id: lastId }),
  });
  return response.ok ? { data: true } : (toResult(response) as { error: ApiError });
}

/**
 * Melaporkan chat pesanan ke admin dengan alasan singkat (POST /merchant/orders/:code/chat-report). Admin lalu bisa
 * membaca seluruh chat pesanan ini. Laporan tetap boleh setelah chat ditutup.
 * @param code kode pesanan
 * @param reason alasan laporan, 5–500 karakter setelah di-trim
 * @returns `{ data }` berisi laporan tersimpan; `{ error }` bila alasan tidak sah atau backend menolak (mis. 409
 *   ALREADY_REPORTED bila toko sudah melaporkan chat ini)
 * @throws dialihkan ke halaman masuk (redirect Next.js) oleh requireMerchant bila sesi penjual tidak ada
 */
export async function reportChat(
  code: string,
  reason: string,
): Promise<ActionResult<{ id: number; reporter_role: string; reason: string; created_at: string }>> {
  await requireMerchant();
  if (typeof code !== "string") return invalidOrder();
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason.length < 5 || trimmedReason.length > 500)
    return errorResult("VALIDATION_ERROR", REASON_LENGTH_MESSAGE);
  return toResult(
    await merchantFetch<{ id: number; reporter_role: string; reason: string; created_at: string }>(
      chatPath(code, "chat-report"),
      { method: "POST", body: JSON.stringify({ reason: trimmedReason }) },
    ),
  );
}

/**
 * Meminta alamat unggah bertanda tangan untuk foto chat (POST /merchant/orders/:code/messages/upload). Folder fotonya
 * ditentukan server dari pesanan ini. Browser lalu mengunggah file langsung ke alamat itu dengan PUT.
 * @param code kode pesanan
 * @param file jenis file (`content_type`) dan ukuran dalam byte (`size`)
 * @returns `{ data: { upload_url, public_url, expires_at } }`; `{ error }` bila backend menolak (mis. 409 chat
 *   tertutup, 400 jenis atau ukuran file tidak sah, 503 unggah belum tersedia)
 * @throws dialihkan ke halaman masuk (redirect Next.js) oleh requireMerchant bila sesi penjual tidak ada
 */
export async function requestChatUpload(
  code: string,
  file: { content_type: string; size: number },
): Promise<ActionResult<{ upload_url: string; public_url: string; expires_at: string }>> {
  await requireMerchant();
  if (typeof code !== "string") return invalidOrder();
  return toResult(
    await merchantFetch<{ upload_url: string; public_url: string; expires_at: string }>(
      chatPath(code, "messages/upload"),
      { method: "POST", body: JSON.stringify({ content_type: file?.content_type, size: file?.size }) },
    ),
  );
}
