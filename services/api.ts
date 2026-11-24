import "server-only";

// Lapisan paling bawah sebelum backend: semua panggilan HTTP ke API backend lewat file ini.
// Alur baca data: halaman -> services -> api.ts -> backend. Alur ubah data: form/tombol -> server action -> api.ts
// -> backend, kadang lewat services. Hanya berjalan di server ("server-only"), jadi alamat backend dan token sesi
// tidak pernah sampai ke browser.

import { headers as requestHeaders } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types/api";
import { getSessionToken } from "@/services/auth.service";

type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
/**
 * Hasil mentah satu panggilan API: berhasil/tidak, kode status HTTP, data, meta (mis. paginasi), atau galat.
 */
export type ApiResult<T> = { ok: boolean; status: number; data?: T; meta?: unknown; error?: ApiError };

/**
 * Memanggil backend dengan fetch (fungsi bawaan untuk mengirim permintaan HTTP).
 * Selalu tanpa cache, batas waktu 10 detik, dan meneruskan X-Request-Id dari proxy.ts agar log web dan backend bisa dicocokkan.
 * @param path path API setelah /api/v1, mis. "/meta/categories"
 * @param init opsi fetch, ditambah `token` sesi bila perlu login
 * @returns `ApiResult`; jaringan putus menjadi galat "NETWORK" (tidak melempar)
 * @throws Error bila env BACKEND_API_URL belum diatur
 */
export async function apiFetch<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<ApiResult<T>> {
  // 1. Siapkan alamat backend dan ambil X-Request-Id dari proxy.ts.
  const baseUrl = process.env.BACKEND_API_URL;
  if (!baseUrl) throw new Error("BACKEND_API_URL belum diatur.");
  const { token, headers, ...rest } = init;
  // Di luar konteks permintaan (mis. skrip), headers() melempar galat -> kirim tanpa ID.
  let requestId: string | null = null;
  try {
    requestId = (await requestHeaders()).get("x-request-id");
  } catch {}
  // 2. Kirim permintaan; jaringan putus atau lewat 10 detik menjadi galat "NETWORK".
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
  // 3. Baca JSON jawaban: ambil `data` dan `meta` bila berhasil, atau `error` dari backend.
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok)
    return { ok: true, status: response.status, data: body?.data as T, ...(body?.meta ? { meta: body.meta } : {}) };
  return {
    ok: false,
    status: response.status,
    error: body?.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." },
  };
}

/**
 * Mengubah `ApiResult` menjadi hasil sederhana untuk server action dan halaman.
 * @param response hasil `apiFetch`
 * @returns `{ data }` bila berhasil, selain itu `{ error }` dari backend (atau pesan umum)
 */
export function toResult<T>(response: ApiResult<T>): ActionResult<T> {
  return response.ok && response.data
    ? { data: response.data }
    : { error: response.error ?? { code: "UNKNOWN", message: "Terjadi kesalahan. Coba lagi." } };
}

/**
 * Memanggil API penjual (/api/v1/merchant<path>) dengan token sesi dari cookie.
 * Bila sesi habis (401), pengguna langsung dialihkan ke halaman masuk.
 * @param path path setelah /merchant, mis. "/orders"
 * @param init opsi fetch tanpa header
 * @returns hasil `apiFetch` (tidak kembali bila sesi habis, karena langsung dialihkan)
 */
export async function merchantFetch<T>(path: string, init: Omit<RequestInit, "headers"> = {}): Promise<ApiResult<T>> {
  const token = await getSessionToken();
  const response = await apiFetch<T>(`/merchant${path}`, { ...init, token });
  if (response.status === 401) redirect("/login?alasan=sesi-habis");
  return response;
}

/**
 * Memanggil API admin (/api/v1/admin<path>) dengan token sesi; hasilnya sama dengan `apiFetch` (termasuk `meta` paginasi).
 * Bila sesi habis (401), pengguna langsung dialihkan ke halaman masuk.
 * @param path path setelah /admin
 * @param init opsi fetch tanpa header
 * @returns hasil `apiFetch` (tidak kembali bila sesi habis, karena langsung dialihkan)
 */
export async function adminFetch<T>(path: string, init: Omit<RequestInit, "headers"> = {}): Promise<ApiResult<T>> {
  const token = await getSessionToken();
  const response = await apiFetch<T>(`/admin${path}`, { ...init, token });
  if (response.status === 401) redirect("/login?alasan=sesi-habis");
  return response;
}
