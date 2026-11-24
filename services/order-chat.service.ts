import "server-only";

// Data chat pesanan penjual dari backend: pesan satu pesanan (GET /merchant/orders/:code/messages), ringkasan chat
// yang punya pesan pembeli belum dibaca (GET /merchant/chats/unread) untuk badge sidebar, dan daftar chat yang pesan
// terakhirnya dari pembeli (GET /merchant/chats/unreplied) untuk daftar "Chat belum dibalas".
// Posisi di alur: halaman atau route handler (baca data) -> services (file ini) -> api.ts -> backend.

import { toResult, merchantFetch } from "@/services/api";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { ChatMessage, ChatState, UnreadChats, UnrepliedChats } from "@/types/order-chat";

/**
 * Mengambil pesan chat satu pesanan beserta keadaan chatnya.
 * @param code kode pesanan
 * @param afterId bila diisi, hanya pesan dengan id lebih besar dari ini; bila kosong, seluruh riwayat
 * @returns `{ data: { messages, chat } }` (pesan urut id naik) atau `{ error }` (mis. NOT_FOUND untuk pesanan toko lain)
 */
export async function getOrderChat(
  code: string,
  afterId?: number,
): Promise<DataResult<{ messages: ChatMessage[]; chat: ChatState }>> {
  const query = afterId === undefined ? "" : `?after_id=${afterId}`;
  return toResult(
    await merchantFetch<{ messages: ChatMessage[]; chat: ChatState }>(
      `/orders/${encodeURIComponent(code)}/messages${query}`,
    ),
  );
}

/**
 * Mengambil ringkasan chat yang punya pesan pembeli belum dibaca. Skenario /pratinjau (hanya mode pengembangan) bisa
 * memaksa kosong atau gagal tanpa memanggil backend.
 * @returns `{ data: { total, orders } }` (pesanan terbaru dulu) atau `{ error }`
 */
export async function getUnreadChats(): Promise<DataResult<UnreadChats>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: { total: 0, orders: [] } };
  return toResult(await merchantFetch<UnreadChats>("/chats/unread"));
}

/**
 * Mengambil daftar chat belum dibalas (pesan terakhirnya dari pembeli). Skenario /pratinjau (hanya mode pengembangan)
 * bisa memaksa kosong atau gagal tanpa memanggil backend.
 * @returns `{ data: { total, orders } }` (paling lama menunggu dulu) atau `{ error }`
 */
export async function getUnrepliedChats(): Promise<DataResult<UnrepliedChats>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: { total: 0, orders: [] } };
  return toResult(await merchantFetch<UnrepliedChats>("/chats/unreplied"));
}

/**
 * Jumlah pesan pembeli belum dibaca untuk badge sidebar. Bila gagal dianggap 0 (sama seperti badge lain).
 * @returns jumlah pesan belum dibaca di semua chat
 */
export async function getUnreadChatCount(): Promise<number> {
  const result = await getUnreadChats();
  return "data" in result ? result.data.total : 0;
}
