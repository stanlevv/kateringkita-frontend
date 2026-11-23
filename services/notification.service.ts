import "server-only";
import { apiFetch } from "@/services/api";
import { getSessionToken } from "@/services/auth.service";
import { getScenario } from "@/lib/scenario";
import type { DataResult } from "@/types/api";
import type { AppNotification } from "@/types/notification";

export const LIMIT_NOTIFICATIONS = 20;
type NotificationMeta = { total?: number; unread_count?: number };

// GET /me/notifications (semua peran): pengumuman admin, hasil moderasi foto menu, dll.
export async function getNotifications(
  page: number,
): Promise<DataResult<{ rows: AppNotification[]; total: number; unread: number }>> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (scenario === "kosong" || scenario === "penjual-baru") return { data: { rows: [], total: 0, unread: 0 } };
  const response = await apiFetch<AppNotification[]>(`/me/notifications?page=${page}&limit=${LIMIT_NOTIFICATIONS}`, {
    token: await getSessionToken(),
  });
  if (!response.ok || !response.data)
    return { error: response.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
  const meta = (response.meta ?? {}) as NotificationMeta;
  return { data: { rows: response.data, total: meta.total ?? response.data.length, unread: meta.unread_count ?? 0 } };
}

/** Badge sidebar "Notifikasi"; galat dianggap 0 (sama dengan getJumlahTindakan). */
export async function getUnreadNotificationCount(): Promise<number> {
  const scenario = await getScenario();
  if (scenario === "gagal-muat" || scenario === "kosong" || scenario === "penjual-baru") return 0;
  const response = await apiFetch<AppNotification[]>("/me/notifications?limit=1", { token: await getSessionToken() });
  return response.ok ? Number((response.meta as NotificationMeta | undefined)?.unread_count ?? 0) : 0;
}
