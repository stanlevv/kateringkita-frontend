// Route handler GET /api/chat/belum-dibaca: dipanggil pemberitahuan chat di layout penjual (ChatNotifier) secara
// berkala untuk membaca jumlah pesan pembeli belum dibaca per pesanan (backend lewat getUnreadChats).
// Dipakai route handler, bukan server action, karena server action dari satu halaman dijalankan bergantian; cek
// berkala akan mengantre di depan aksi penjual. Token tetap dibaca dari cookie sesi.
import { NextResponse } from "next/server";
import { getUnreadChats } from "@/services/order-chat.service";
import { requireMerchant } from "@/services/auth.service";

// Jawaban JSON yang tidak boleh disimpan cache, karena isinya berubah terus.
const jsonResponse = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Mengambil ringkasan chat yang punya pesan pembeli belum dibaca.
 * @returns 200 `{ data: { total, orders } }` atau 503 `{ error }` bila backend gagal.
 *   Tanpa sesi penjual, requireMerchant mengalihkan ke /login?alasan=sesi-habis.
 */
export async function GET() {
  // Wajib penjual yang sudah masuk (proxy.ts tidak menjaga /api, jadi handler menjaga dirinya sendiri).
  await requireMerchant();
  const result = await getUnreadChats();
  return "data" in result ? jsonResponse({ data: result.data }, 200) : jsonResponse({ error: result.error }, 503);
}
