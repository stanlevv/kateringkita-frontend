// Bentuk data notifikasi untuk semua peran (GET /me/notifications).

/**
 * Satu notifikasi. `type` bisa order_status, promo, info, atau moderation; `read_at` null berarti belum dibaca.
 */
export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};
