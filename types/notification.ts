// GET /me/notifications; type: order_status | promo | info | moderation
export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};
