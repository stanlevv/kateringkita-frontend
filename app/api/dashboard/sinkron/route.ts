// Route handler GET /api/dashboard/sinkron?sejak=<waktu ISO>: dipanggil dashboard penjual secara berkala (polling)
// untuk mengambil pesanan yang berubah sejak waktu itu (backend lewat getChangedOrders), daftar menu terbaru (getMenus),
// dan pesan chat belum dibaca (getUnreadChats): jumlahnya untuk badge sidebar, rincian per pesanan untuk tombol Chat di
// kartu pesanan dan pemberitahuan pesan baru.
// Route handler adalah file route.ts yang menjawab permintaan HTTP langsung (di sini GET), bukan menampilkan halaman.
// Dipakai route handler, bukan server action, karena server action dari satu halaman dijalankan bergantian; polling
// yang sering akan mengantre di depan aksi penjual (mis. terima pesanan). Token tetap dibaca dari cookie sesi.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getMenus } from "@/services/menu.service";
import { getChangedOrders } from "@/services/order.service";
import { getUnreadChats } from "@/services/order-chat.service";
import { requireMerchant } from "@/services/auth.service";

// `sejak` wajib berupa tanggal-waktu ISO lengkap dengan zona waktu (mis. 2026-11-01T03:00:00.000Z).
const SINCE_SCHEMA = z.iso.datetime({ offset: true });
// Jawaban JSON yang tidak boleh disimpan cache, karena isinya berubah terus.
const jsonResponse = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Mengambil perubahan pesanan dan menu untuk dashboard, ditambah jumlah pesan chat belum dibaca.
 * @param request permintaan masuk; parameter `sejak` dibaca dari URL
 * @returns 200 `{ data: { orders, menus, unread_chats?, unread_chat_orders? } }` (`unread_chats` = jumlah pesan,
 *   `unread_chat_orders` = rincian per pesanan; keduanya hanya ada bila data chat berhasil diambil); 400 bila `sejak` tidak sah; 503 `{ error }` bila pesanan atau menu gagal diambil.
 *   Tanpa sesi penjual, requireMerchant mengalihkan ke /login?alasan=sesi-habis.
 */
export async function GET(request: NextRequest) {
  // 1. Wajib penjual yang sudah masuk (proxy.ts tidak menjaga /api, jadi handler menjaga dirinya sendiri).
  await requireMerchant();
  const since = SINCE_SCHEMA.safeParse(request.nextUrl.searchParams.get("sejak"));
  if (!since.success) return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid." } }, 400);
  // 2. Ambil pesanan yang berubah, menu, dan jumlah chat bersamaan; pesanan atau menu gagal -> 503.
  const [orders, menus, unreadChats] = await Promise.all([getChangedOrders(since.data), getMenus(), getUnreadChats()]);
  if ("error" in orders) return jsonResponse({ error: orders.error }, 503);
  if ("error" in menus) return jsonResponse({ error: menus.error }, 503);
  // 3. Data chat hanya pelengkap: bila gagal, kuncinya dilewati, bukan menggagalkan sinkron.
  const chatCount =
    "data" in unreadChats ? { unread_chats: unreadChats.data.total, unread_chat_orders: unreadChats.data.orders } : {};
  return jsonResponse({ data: { orders: orders.data, menus: menus.data, ...chatCount } }, 200);
}
