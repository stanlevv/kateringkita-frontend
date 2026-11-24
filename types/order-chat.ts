// Bentuk data chat pesanan dari backend (GET /merchant/orders/:code/messages, GET /merchant/chats/unread, dan
// GET /merchant/chats/unreplied).
// Nama properti mengikuti JSON backend.

/** Satu pesan chat. Pesan berisi teks, foto, atau keduanya; `created_at` berupa waktu ISO UTC. */
export type ChatMessage = {
  id: number;
  sender_role: "customer" | "merchant";
  body: string | null;
  image_url: string | null;
  created_at: string;
};

/**
 * Keadaan chat dilihat dari sisi penjual. `is_open` true hanya saat pesanan dikonfirmasi, dimasak, atau siap.
 * `closed_reason`: "not_started" (pesanan belum diterima), "finished" (selesai, dibatalkan, atau kedaluwarsa),
 * "unavailable" (pesanan tamu meja), atau null bila chat terbuka.
 */
export type ChatState = {
  available: boolean;
  is_open: boolean;
  closed_reason: "not_started" | "finished" | "unavailable" | null;
  unread_count: number;
  other_party_last_read_id: number | null;
  reported_by_me: boolean;
};

/** Ringkasan chat yang punya pesan pembeli belum dibaca: total pesan dan rinciannya per pesanan (terbaru dulu). */
export type UnreadChats = {
  total: number;
  orders: { code: string; unread_count: number; last_message_at: string }[];
};

/**
 * Chat belum dibalas: pesanan yang chatnya terbuka dan pesan terakhirnya dari pembeli, yang paling lama menunggu dulu.
 * `total` = jumlah pesanan; `last_message_at` = waktu pesan pembeli yang belum dibalas; `unread_count` = pesan pembeli
 * yang belum dibaca (bisa 0 bila sudah dibaca tetapi belum dibalas).
 */
export type UnrepliedChats = {
  total: number;
  orders: { code: string; status: string; last_message_at: string; unread_count: number }[];
};
