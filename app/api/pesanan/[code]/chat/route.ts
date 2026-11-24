// Route handler GET /api/pesanan/[code]/chat?after_id=<id>: dipanggil panel chat penjual secara berkala (tiap 5 detik)
// untuk mengambil pesan baru dan keadaan chat satu pesanan (backend lewat getOrderChat).
// Dipakai route handler, bukan server action, karena server action dari satu halaman dijalankan bergantian; cek
// berkala akan mengantre di depan aksi penjual (mis. kirim pesan atau ubah status). Token tetap dibaca dari cookie sesi.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getOrderChat } from "@/services/order-chat.service";
import { requireMerchant } from "@/services/auth.service";

// `after_id` opsional, tetapi bila ada harus bilangan bulat ≥ 0 (paling banyak 15 digit agar tetap bilangan aman).
const AFTER_ID_SCHEMA = z
  .string()
  .regex(/^\d{1,15}$/)
  .transform(Number)
  .optional();
// Jawaban JSON yang tidak boleh disimpan cache, karena isinya berubah terus.
const jsonResponse = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Mengambil pesan chat pesanan setelah `after_id` (tanpa `after_id` = seluruh riwayat).
 * @param request permintaan masuk; parameter `after_id` dibaca dari URL
 * @param context parameter route; `code` = kode pesanan dari URL
 * @returns 200 `{ data: { messages, chat } }`; 400 bila `after_id` bukan angka; 503 `{ error }` bila backend gagal.
 *   Tanpa sesi penjual, requireMerchant mengalihkan ke /login?alasan=sesi-habis.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  // 1. Wajib penjual yang sudah masuk (proxy.ts tidak menjaga /api, jadi handler menjaga dirinya sendiri).
  await requireMerchant();
  const afterId = AFTER_ID_SCHEMA.safeParse(request.nextUrl.searchParams.get("after_id") ?? undefined);
  if (!afterId.success) return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid." } }, 400);
  // 2. Ambil pesan dari backend; galat apa pun -> 503 (panel mencoba lagi pada cek berikutnya).
  const { code } = await params;
  const result = await getOrderChat(code, afterId.data);
  if ("error" in result) return jsonResponse({ error: result.error }, 503);
  return jsonResponse({ data: result.data }, 200);
}
