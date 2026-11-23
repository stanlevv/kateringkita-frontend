import "server-only";

// Sesi login di server: membaca token dari cookie dan memastikan peran pengguna sebelum halaman dirender.
// Cookie httpOnly = cookie yang tidak bisa dibaca JavaScript di browser, jadi token aman dari skrip jahat.
// Posisi di alur: halaman/actions -> services (file ini) -> api.ts -> backend.

import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiFetch } from "@/services/api";
import type { AdminLevel } from "@/lib/admin-level";

/** Nama cookie httpOnly yang menyimpan token sesi. */
export const SESSION_COOKIE = "kk_session";

/** Data sesi dari GET /me: pengguna dan toko (bila penjual). */
export type Session = { user: Record<string, unknown>; merchant: Record<string, unknown> | null };

/**
 * Membaca token sesi dari cookie.
 * @returns token, atau undefined bila belum login
 */
export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/**
 * Mengambil data sesi dari backend. Dibungkus `cache()` agar layout dan halaman dalam satu permintaan cukup memanggil backend sekali.
 * @returns sesi, atau null bila belum login/sesi habis
 * @throws Error bila backend menjawab galat selain 401
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  const response = await apiFetch<Session>("/me", { token });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(response.error?.message ?? "Gagal memuat sesi.");
  return response.data ?? null;
});

/**
 * Memastikan yang login adalah penjual. Belum login -> halaman masuk; admin -> panel admin; pembeli -> ditolak dengan pesan.
 * @returns sesi penjual
 */
export async function requireMerchant(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?alasan=sesi-habis");
  if (session.user.role === "admin") redirect("/admin");
  if (session.user.role !== "merchant") redirect("/login?alasan=bukan-penjual");
  return session;
}

/**
 * Memastikan yang login adalah admin. Peran lain mendapat halaman 404 agar keberadaan panel tidak terlihat.
 * Tanpa argumen: admin tingkat apa pun boleh. Dengan argumen: tingkat lain juga 404 (backend tetap pemeriksa utamanya).
 * @param levels tingkat admin yang boleh
 * @returns sesi admin
 */
export async function requireAdmin(...levels: AdminLevel[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?alasan=sesi-habis");
  if (session.user.role !== "admin") notFound();
  if (levels.length && !levels.includes(session.user.admin_level as AdminLevel)) notFound();
  return session;
}
