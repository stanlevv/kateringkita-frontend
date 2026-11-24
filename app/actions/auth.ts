"use server";

// Server action masuk, daftar penjual, keluar, dan lupa kata sandi untuk web (penjual dan admin).
// "use server" menandai fungsi di file ini sebagai server action: dijalankan di server Next.js saat form dikirim atau dipanggil komponen.
// Posisi di alur (ubah data): form/tombol -> server action (file ini) -> api.ts -> backend, kadang lewat services.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/services/api";
import { safeNext } from "@/lib/safe-next";
import { SESSION_COOKIE, getSessionToken } from "@/services/auth.service";

/**
 * Hasil form auth yang dibaca komponen: pesan galat, kode galat, pesan per field, atau `ok: true` bila berhasil.
 * Kode yang mungkin: UNAUTHENTICATED, VALIDATION_ERROR, RATE_LIMITED, NETWORK, CONFLICT (dari backend) atau NOT_MERCHANT.
 */
export type AuthState = { error?: string; code?: string; fields?: Record<string, string[]>; ok?: boolean };

// FormData = isi form yang dikirim browser (pasangan nama field -> nilai). Fungsi ini membaca satu field sebagai teks rapi.
const readFormText = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

/**
 * Menyusun header berisi IP pengunjung untuk backend, agar batas percobaan login dihitung per pengunjung, bukan per server web.
 * Backend hanya mempercayai IP ini bila dikirim bersama rahasia internal, jadi tanpa env INTERNAL_API_SECRET tidak ada header.
 * @returns header X-Client-IP (bila IP diketahui) dan X-Internal-Secret, atau undefined bila rahasia belum diatur
 */
async function clientIpHeaders(): Promise<Record<string, string> | undefined> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return undefined;
  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-real-ip")?.trim() || requestHeaders.get("x-forwarded-for")?.split(",")[0].trim();
  return { ...(clientIp ? { "X-Client-IP": clientIp } : {}), "X-Internal-Secret": secret };
}

/**
 * Menyimpan token di cookie sesi httpOnly yang habis bersamaan dengan sesi di backend.
 * Sengaja tidak diekspor: fungsi yang diekspor dari file "use server" menjadi server action yang bisa dipanggil dari browser.
 */
async function startSession(token: string, expiresAt: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

/**
 * Masuk dengan email atau nomor WA dan kata sandi (POST /auth/login), lalu menyimpan token di cookie sesi.
 * Cookie httpOnly tidak bisa dibaca JavaScript di browser, jadi token aman dari skrip pihak ketiga.
 * `redirect()` menghentikan fungsi dan mengarahkan browser ke halaman lain.
 * @param _previousState hasil sebelumnya (tidak dipakai; ada agar bentuknya cocok dengan useActionState)
 * @param form field form `identifier`, `password`, dan `next` (halaman tujuan setelah masuk)
 * @returns `AuthState` berisi galat bila login ditolak atau akun pembeli (NOT_MERCHANT).
 *   Bila berhasil tidak kembali: admin dialihkan ke /admin (atau `next` di bawah /admin), penjual ke `next` atau /dashboard.
 */
export async function login(_previousState: AuthState, form: FormData): Promise<AuthState> {
  // 1. Kirim kredensial ke backend beserta IP pengunjung.
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

  // 2. Web hanya untuk penjual dan admin: token pembeli langsung dicabut lagi.
  const role = response.data.user?.role;
  if (role !== "merchant" && role !== "admin") {
    await apiFetch("/auth/logout", { method: "POST", token: response.data.token }).catch(() => {});
    return { error: "Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.", code: "NOT_MERCHANT" };
  }

  // 3. Simpan token di cookie httpOnly yang habis bersamaan dengan sesi di backend.
  await startSession(response.data.token, response.data.expires_at);
  // 4. Arahkan ke tujuan yang aman (safeNext menolak alamat situs lain): admin tetap di area admin, penjual tidak boleh ke area admin.
  const next = String(form.get("next") ?? "");
  if (role === "admin") {
    const target = safeNext(next, "/admin");
    redirect(target === "/admin" || target.startsWith("/admin/") || target.startsWith("/admin?") ? target : "/admin");
  }
  const target = safeNext(next);
  redirect(target.startsWith("/admin") ? "/dashboard" : target); // penjual tidak diarahkan ke area admin
}

/**
 * Mendaftarkan akun penjual baru (POST /auth/merchant/register).
 * @param _previousState hasil sebelumnya (tidak dipakai; ada agar bentuknya cocok dengan useActionState)
 * @param form field form `full_name`, `phone`, `email`, `password`, `business_name`, `merchant_type_id`, `address`
 * @returns `AuthState` berisi galat dari backend bila daftar ditolak (mis. email sudah dipakai, pesan per field).
 *   Bila terdaftar dan masuk otomatis berhasil, tidak kembali: penjual dialihkan ke /dashboard.
 *   Bila terdaftar tetapi masuk otomatis gagal, `{ ok: true }` (layar berhasil, penjual masuk manual).
 */
export async function registerMerchant(_previousState: AuthState, form: FormData): Promise<AuthState> {
  // 1. Baca field form (teks dirapikan, kata sandi apa adanya) dan kirim ke backend.
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
  // 2. Galat backend (mis. email sudah dipakai) diteruskan ke form apa adanya.
  if (!response.ok)
    return { error: response.error?.message, code: response.error?.code, fields: response.error?.fields };
  // 3. Masuk otomatis dengan nomor WA dan kata sandi yang sama. Bila gagal (batas percobaan, jaringan, bukan penjual),
  //    akun sudah terbuat, jadi tetap `{ ok: true }` agar form menampilkan layar berhasil dan penjual tidak mendaftar ulang.
  const session = await apiFetch<{ token: string; expires_at: string; user?: { role?: string } }>("/auth/login", {
    method: "POST",
    headers: await clientIpHeaders(),
    body: JSON.stringify({
      identifier: readFormText(form, "phone"),
      password: String(form.get("password") ?? ""),
      client: "web",
    }),
  });
  if (!session.ok || !session.data) return { ok: true };
  if (session.data.user?.role !== "merchant") {
    await apiFetch("/auth/logout", { method: "POST", token: session.data.token }).catch(() => {});
    return { ok: true };
  }
  await startSession(session.data.token, session.data.expires_at);
  // redirect() melempar, jadi dipanggil di luar try/catch; di klien navigasi dilakukan Next.
  redirect("/dashboard");
}

/**
 * Keluar: mencabut token di backend (bila ada), menghapus cookie sesi, lalu mengarahkan ke /login.
 * Kegagalan backend diabaikan agar pengguna tetap bisa keluar.
 */
export async function logout() {
  const token = await getSessionToken();
  if (token) await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/**
 * Meminta kode OTP (kode sekali pakai) reset kata sandi ke email akun (POST /auth/password/forgot).
 * Backend menjawab sama untuk email terdaftar maupun tidak, agar orang lain tidak bisa menebak email yang terdaftar.
 * @param email email akun
 * @returns `{ ok: true }`, atau `AuthState` berisi galat (mis. terlalu sering meminta kode)
 */
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

/**
 * Mengganti kata sandi dengan kode OTP dari email (POST /auth/password/reset).
 * @param input email akun, kode OTP (`code`), dan kata sandi baru (`password`)
 * @returns `{ ok: true }`, atau `AuthState` berisi galat (mis. kode salah atau kedaluwarsa, pesan per field)
 */
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
