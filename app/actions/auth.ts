"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/services/api";
import { safeNext } from "@/lib/safe-next";
import { SESSION_COOKIE, getSessionToken } from "@/services/auth.service";

// code: UNAUTHENTICATED | VALIDATION_ERROR | RATE_LIMITED | NETWORK | CONFLICT (dari apiFetch) atau NOT_MERCHANT.
export type AuthState = { error?: string; code?: string; fields?: Record<string, string[]>; ok?: boolean };

const readFormText = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

// F01-SEC-2: teruskan IP pengunjung ke API (dipercaya API hanya bersama rahasia internal)
async function clientIpHeaders(): Promise<Record<string, string> | undefined> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return undefined;
  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-real-ip")?.trim() || requestHeaders.get("x-forwarded-for")?.split(",")[0].trim();
  return { ...(clientIp ? { "X-Client-IP": clientIp } : {}), "X-Internal-Secret": secret };
}

export async function login(_previousState: AuthState, form: FormData): Promise<AuthState> {
  const response = await apiFetch<{ token: string; expires_at: string; user?: { role?: string } }>("/auth/login", {
    method: "POST",
    headers: await clientIpHeaders(),
    body: JSON.stringify({
      identifier: readFormText(form, "identifier"),
      password: String(form.get("password") ?? ""),
      client: "web",
    }),
  });
  if (!response.ok || !response.data)
    return { error: response.error?.message, code: response.error?.code, fields: response.error?.fields };

  const role = response.data.user?.role;
  if (role !== "merchant" && role !== "admin") {
    await apiFetch("/auth/logout", { method: "POST", token: response.data.token }).catch(() => {});
    return { error: "Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.", code: "NOT_MERCHANT" };
  }

  (await cookies()).set(SESSION_COOKIE, response.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(response.data.expires_at),
  });
  const next = String(form.get("next") ?? "");
  if (role === "admin") {
    const target = safeNext(next, "/admin");
    redirect(target === "/admin" || target.startsWith("/admin/") || target.startsWith("/admin?") ? target : "/admin");
  }
  const target = safeNext(next);
  redirect(target.startsWith("/admin") ? "/dashboard" : target); // penjual tidak diarahkan ke area admin
}

export async function registerMerchant(_previousState: AuthState, form: FormData): Promise<AuthState> {
  const response = await apiFetch("/auth/merchant/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: readFormText(form, "full_name"),
      phone: readFormText(form, "phone"),
      email: readFormText(form, "email"),
      password: String(form.get("password") ?? ""),
      business_name: readFormText(form, "business_name"),
      merchant_type_id: Number(form.get("merchant_type_id")),
      address: readFormText(form, "address"),
    }),
  });
  if (!response.ok)
    return { error: response.error?.message, code: response.error?.code, fields: response.error?.fields };
  return { ok: true };
}

export async function logout() {
  const token = await getSessionToken();
  if (token) await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// F11 lupa sandi: kode OTP dikirim ke email akun; jawaban API sama untuk email terdaftar atau tidak.
export async function requestResetCode(email: string): Promise<AuthState> {
  const response = await apiFetch("/auth/password/forgot", {
    method: "POST",
    headers: await clientIpHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!response.ok)
    return { error: response.error?.message, code: response.error?.code, fields: response.error?.fields };
  return { ok: true };
}

export async function resetPassword(input: { email: string; code: string; password: string }): Promise<AuthState> {
  const response = await apiFetch("/auth/password/reset", {
    method: "POST",
    headers: await clientIpHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok)
    return { error: response.error?.message, code: response.error?.code, fields: response.error?.fields };
  return { ok: true };
}
