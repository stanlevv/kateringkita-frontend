import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiFetch } from "@/services/api";
import type { AdminLevel } from "@/lib/admin-level";

export const SESSION_COOKIE = "kk_session";

export type Session = { user: Record<string, unknown>; merchant: Record<string, unknown> | null };

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  const response = await apiFetch<Session>("/me", { token });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(response.error?.message ?? "Gagal memuat sesi.");
  return response.data ?? null;
});

// Penjual. Admin dialihkan ke panelnya; pembeli ditolak.
export async function requireMerchant(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?alasan=sesi-habis");
  if (session.user.role === "admin") redirect("/admin");
  if (session.user.role !== "merchant") redirect("/login?alasan=bukan-penjual");
  return session;
}

// Admin. Role lain mendapat 404 agar keberadaan panel tidak terlihat.
// Tanpa argumen: admin tingkat apa pun. Dengan tingkat: tingkat lain juga 404 (backend tetap penjaga utamanya).
export async function requireAdmin(...levels: AdminLevel[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?alasan=sesi-habis");
  if (session.user.role !== "admin") notFound();
  if (levels.length && !levels.includes(session.user.admin_level as AdminLevel)) notFound();
  return session;
}
