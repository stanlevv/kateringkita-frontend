import "server-only";
import { headers as requestHeaders } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types/api";
import { getSessionToken } from "@/services/auth.service";

type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
export type ApiResult<T> = { ok: boolean; status: number; data?: T; meta?: unknown; error?: ApiError };

export async function apiFetch<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<ApiResult<T>> {
  const baseUrl = process.env.BACKEND_API_URL;
  if (!baseUrl) throw new Error("BACKEND_API_URL belum diatur.");
  const { token, headers, ...rest } = init;
  // dari proxy.ts; di luar konteks request (mis. skrip) headers() melempar -> tanpa ID
  let requestId: string | null = null;
  try {
    requestId = (await requestHeaders()).get("x-request-id");
  } catch {}
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(requestId ? { "X-Request-Id": requestId } : {}),
        ...headers,
      },
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: { code: "NETWORK", message: "Server tidak dapat dihubungi. Coba lagi sesaat lagi." },
    };
  }
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok)
    return { ok: true, status: response.status, data: body?.data as T, ...(body?.meta ? { meta: body.meta } : {}) };
  return {
    ok: false,
    status: response.status,
    error: body?.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." },
  };
}

/** Hasil server action: `{ data }` bila berhasil, selain itu `{ error }` dari backend (atau pesan umum). */
export function toResult<T>(response: ApiResult<T>): ActionResult<T> {
  return response.ok && response.data
    ? { data: response.data }
    : { error: response.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}

/** Panggilan ke /api/v1/merchant<path> dengan token sesi. Sesi habis (401) -> ke halaman masuk. */
export async function merchantFetch<T>(path: string, init: Omit<RequestInit, "headers"> = {}): Promise<ApiResult<T>> {
  const token = await getSessionToken();
  const response = await apiFetch<T>(`/merchant${path}`, { ...init, token });
  if (response.status === 401) redirect("/login?alasan=sesi-habis");
  return response;
}

/** Panggilan ke /api/v1/admin<path> dengan token sesi; hasil sama dengan apiFetch (termasuk `meta` paginasi). Sesi habis (401) -> halaman masuk. */
export async function adminFetch<T>(path: string, init: Omit<RequestInit, "headers"> = {}): Promise<ApiResult<T>> {
  const token = await getSessionToken();
  const response = await apiFetch<T>(`/admin${path}`, { ...init, token });
  if (response.status === 401) redirect("/login?alasan=sesi-habis");
  return response;
}
