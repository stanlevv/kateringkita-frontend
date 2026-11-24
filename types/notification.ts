// Bentuk data notifikasi untuk semua peran (GET /me/notifications).

/**
 * Satu notifikasi. `type` bisa order_status, promo, info, moderation, atau chat_message (pesan pembeli; `data`
 * berisi `order_code`); `read_at` null berarti belum dibaca. Di production `data` kadang terkirim sebagai teks JSON,
 * bukan objek, jadi pembacanya harus siap dengan kedua bentuk.
 */
export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | string | null;
  read_at: string | null;
  created_at: string;
};
