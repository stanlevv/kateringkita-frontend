import "server-only";
import { apiFetch } from "@/services/api";
import { getSessionToken } from "@/services/authService";
import { getSkenario } from "@/lib/skenario";
import type { DataResult } from "@/types/api";
import type { Notifikasi } from "@/types/notifikasi";

export const LIMIT_NOTIF = 20;
type Meta = { total?: number; unread_count?: number };

// GET /me/notifications (semua peran): pengumuman admin, hasil moderasi foto menu, dll.
export async function getNotifikasi(
  page: number,
): Promise<DataResult<{ rows: Notifikasi[]; total: number; unread: number }>> {
  const s = await getSkenario();
  if (s === "gagal-muat") return { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } };
  if (s === "kosong" || s === "penjual-baru") return { data: { rows: [], total: 0, unread: 0 } };
  const res = await apiFetch<Notifikasi[]>(`/me/notifications?page=${page}&limit=${LIMIT_NOTIF}`, {
    token: await getSessionToken(),
  });
  if (!res.ok || !res.data)
    return { error: res.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
  const m = (res.meta ?? {}) as Meta;
  return { data: { rows: res.data, total: m.total ?? res.data.length, unread: m.unread_count ?? 0 } };
}

/** Badge sidebar "Notifikasi"; galat dianggap 0 (sama dengan getJumlahTindakan). */
export async function getJumlahNotif(): Promise<number> {
  const s = await getSkenario();
  if (s === "gagal-muat" || s === "kosong" || s === "penjual-baru") return 0;
  const res = await apiFetch<Notifikasi[]>("/me/notifications?limit=1", { token: await getSessionToken() });
  return res.ok ? Number((res.meta as Meta | undefined)?.unread_count ?? 0) : 0;
}
