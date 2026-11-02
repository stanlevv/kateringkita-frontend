import "server-only";
import { redirect } from "next/navigation";
import { apiFetch, type ApiResult } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export { hasil } from "@/lib/api";

/** Panggilan ke /api/v1/admin<path> dengan token sesi. Hasil sama dengan apiFetch (termasuk `meta` paginasi). Sesi habis (401) -> ke halaman masuk. */
export async function adminFetch<T>(path: string, init: Omit<RequestInit, "headers"> = {}): Promise<ApiResult<T>> {
  const token = await getSessionToken();
  const res = await apiFetch<T>(`/admin${path}`, { ...init, token });
  if (res.status === 401) redirect("/login?alasan=sesi-habis");
  return res;
}
