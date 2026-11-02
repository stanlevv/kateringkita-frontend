import "server-only";
import type { ActionResult } from "@/lib/types";

type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
export type ApiResult<T> = { ok: boolean; status: number; data?: T; meta?: unknown; error?: ApiError };

export async function apiFetch<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<ApiResult<T>> {
  const base = process.env.BACKEND_API_URL;
  if (!base) throw new Error("BACKEND_API_URL belum diatur.");
  const { token, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...rest,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    return { ok: false, status: 0, error: { code: "NETWORK", message: "Server tidak dapat dihubungi. Coba lagi sesaat lagi." } };
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.ok) return { ok: true, status: res.status, data: body?.data as T, ...(body?.meta ? { meta: body.meta } : {}) };
  return { ok: false, status: res.status, error: body?.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}

/** Hasil server action: `{ data }` bila berhasil, selain itu `{ error }` dari backend (atau pesan umum). */
export function hasil<T>(res: ApiResult<T>): ActionResult<T> {
  return res.ok && res.data ? { data: res.data } : { error: res.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}
