import "server-only";
import { redirect } from "next/navigation";
import { apiFetch, type ApiResult } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

/** Panggilan ke /api/v1/merchant<path> dengan token sesi. Sesi habis (401) -> ke halaman masuk. */
export async function merchantFetch<T>(path: string, init: Omit<RequestInit, "headers"> = {}): Promise<ApiResult<T>> {
  const token = await getSessionToken();
  const res = await apiFetch<T>(`/merchant${path}`, { ...init, token });
  if (res.status === 401) redirect("/login?alasan=sesi-habis");
  return res;
}
