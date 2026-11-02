"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { safeNext } from "@/lib/safe-next";
import { SESSION_COOKIE, getSessionToken } from "@/lib/session";

// code: UNAUTHENTICATED | VALIDATION_ERROR | RATE_LIMITED | NETWORK | CONFLICT (dari apiFetch) atau NOT_MERCHANT.
export type AuthState = { error?: string; code?: string; fields?: Record<string, string[]>; ok?: boolean };

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

// F01-SEC-2: teruskan IP pengunjung ke API (dipercaya API hanya bersama rahasia internal)
async function clientIpHeaders(): Promise<Record<string, string> | undefined> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return undefined;
  const h = await headers();
  const ip = h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0].trim();
  return { ...(ip ? { "X-Client-IP": ip } : {}), "X-Internal-Secret": secret };
}

export async function login(_prev: AuthState, form: FormData): Promise<AuthState> {
  const res = await apiFetch<{ token: string; expires_at: string; user?: { role?: string } }>("/auth/login", {
    method: "POST",
    headers: await clientIpHeaders(),
    body: JSON.stringify({ identifier: text(form, "identifier"), password: String(form.get("password") ?? ""), client: "web" }),
  });
  if (!res.ok || !res.data) return { error: res.error?.message, code: res.error?.code, fields: res.error?.fields };

  const role = res.data.user?.role;
  if (role !== "merchant" && role !== "admin") {
    await apiFetch("/auth/logout", { method: "POST", token: res.data.token }).catch(() => {});
    return { error: "Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.", code: "NOT_MERCHANT" };
  }

  (await cookies()).set(SESSION_COOKIE, res.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(res.data.expires_at),
  });
  const next = String(form.get("next") ?? "");
  if (role === "admin") {
    const to = safeNext(next, "/admin");
    redirect(to === "/admin" || to.startsWith("/admin/") || to.startsWith("/admin?") ? to : "/admin");
  }
  const to = safeNext(next);
  redirect(to.startsWith("/admin") ? "/dashboard" : to); // penjual tidak diarahkan ke area admin
}

export async function registerMerchant(_prev: AuthState, form: FormData): Promise<AuthState> {
  const res = await apiFetch("/auth/merchant/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: text(form, "full_name"),
      phone: text(form, "phone"),
      email: text(form, "email"),
      password: String(form.get("password") ?? ""),
      business_name: text(form, "business_name"),
      merchant_type_id: Number(form.get("merchant_type_id")),
      address: text(form, "address"),
    }),
  });
  if (!res.ok) return { error: res.error?.message, code: res.error?.code, fields: res.error?.fields };
  return { ok: true };
}

export async function logout() {
  const token = await getSessionToken();
  if (token) await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
