import { randomUUID } from "node:crypto";
import { expect, type Locator, type Page } from "@playwright/test";

// Semua nilai di sini hanya untuk DB lokal sekali-pakai `kateringkita_e2e`.
// E2E_DATABASE_URL untuk MySQL lokal dengan kredensial lain (mis. Laragon: root tanpa sandi); nama DB tetap harus *_e2e.
export const URL_DB = process.env.E2E_DATABASE_URL ?? "mysql://root:root@127.0.0.1:3306/kateringkita_e2e";
export const JWT_SECRET_UJI = "kunci-uji-e2e-hanya-lokal-0123456789-abcdef";
export const PORT_API = 5050;
export const PORT_WEB = 3050;
export const API = `http://localhost:${PORT_API}/api/v1`;

export const SANDI_UJI = "rahasia123";
export const ADMIN = { phone: "081200000001", fullName: "Admin Uji", password: SANDI_UJI };
// Satu DB dipakai semua spek: tiap spek mendaftar akunnya sendiri dengan nomor urut berbeda.
export const penjualKe = (n: number) => ({
  full_name: `Penjual ${n}`, email: `penjual${n}@mail.com`, phone: `0812900${String(n).padStart(4, "0")}`, password: SANDI_UJI,
  business_name: `Dapur Uji ${n}`, merchant_type_id: 1, address: "Jl. Mawar 1",
});
export const pembeliKe = (n: number) => ({
  full_name: `Pembeli ${n}`, email: `pembeli${n}@mail.com`, phone: `0812800${String(n).padStart(4, "0")}`, password: SANDI_UJI,
});
export type Penjual = ReturnType<typeof penjualKe>;

// env backend harus terisi sebelum kode be/ diimpor (env.ts membaca process.env saat dimuat)
export function isiEnvBackend() {
  Object.assign(process.env, { DATABASE_URL: URL_DB, JWT_SECRET: JWT_SECRET_UJI, NODE_ENV: "development" });
}

async function panggil<T>(method: string, path: string, token?: string, body?: unknown, extra: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json?.data as T;
}

// Dipanggil sekali per DB oleh global-setup.ts (nomor admin unik); kolam koneksi dibiarkan, prosesnya langsung keluar.
export async function buatAdmin(): Promise<void> {
  isiEnvBackend();
  const { createAdmin } = await import("../../be/src/scripts/create-admin");
  await createAdmin(ADMIN);
}

export const daftarPenjual = (p: Penjual) => panggil("POST", "/auth/merchant/register", undefined, p);
export const daftarPembeli = (p: ReturnType<typeof pembeliKe>) => panggil("POST", "/auth/customer/register", undefined, p);

export async function masuk(identifier: string): Promise<string> {
  return (await panggil<{ token: string }>("POST", "/auth/login", undefined, { identifier, password: SANDI_UJI, client: "web" })).token;
}

// Masuk lewat formulir /login yang asli; selesai setelah pindah dari halaman login.
export async function masukLewatForm(page: Page, identifier: string): Promise<void> {
  await page.goto("/login");
  await siapHidrasi(page.getByRole("button", { name: "Masuk" }));
  await page.getByLabel("Email atau nomor WA").fill(identifier);
  await page.getByLabel(/^Kata sandi/).fill(SANDI_UJI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

// HTML dari server sudah tampil sebelum React terpasang (next dev): klik/isian saat itu hilang percuma.
// React menempelkan __reactProps$ pada elemen yang sudah terhidrasi; tunggu tanda itu, tanpa jeda tetap.
export const siapHidrasi = (el: Locator) =>
  expect.poll(() => el.evaluate((n) => Object.keys(n).some((k) => k.startsWith("__reactProps$"))), { timeout: 20_000 }).toBe(true);

export const hariIniWib = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

export async function verifikasiPenjual(tokenAdmin: string, p: Penjual): Promise<void> {
  const antrean = await panggil<{ id: number; business_name: string }[]>("GET", "/admin/verification-queue", tokenAdmin);
  const toko = antrean.find((m) => m.business_name === p.business_name); // sama persis: "Dapur Uji 1" bukan "Dapur Uji 10"
  if (!toko) throw new Error(`Toko "${p.business_name}" tidak ada di antrean verifikasi`);
  const id = toko.id;
  await panggil("POST", `/admin/merchants/${id}/verify`, tokenAdmin, {});
}

// Penjual terverifikasi admin, buka 24 jam (tes tidak bergantung jam nyata), melayani titik temu 1, dengan satu menu.
export async function siapkanToko(tokenAdmin: string, tokenPenjual: string, p: Penjual): Promise<{ menuId: number }> {
  await verifikasiPenjual(tokenAdmin, p);
  await panggil("PATCH", "/merchant/profile", tokenPenjual, { open_time: "00:00", close_time: "23:59", pickup_point_ids: [1] });
  const menu = await panggil<{ id: number }>("POST", "/merchant/menus", tokenPenjual, {
    name: "Nasi Ayam", category_id: 1, unit_label: "porsi", price: 15000, hpp: 9000, daily_quota: 20,
    prep_minutes: 15, is_preorder: false, preorder_days: 0, min_order_qty: 1,
  });
  return { menuId: menu.id };
}

// Checkout pembeli (tunai) lewat API -> kode pesanan
export async function pesan(tokenPembeli: string, menuId: number, qty = 1): Promise<string> {
  const o = await panggil<{ code: string }>("POST", "/orders", tokenPembeli, {
    items: [{ menu_id: menuId, qty }], pickup_point_id: 1, payment_method: "cod",
  }, { "Idempotency-Key": randomUUID() });
  return o.code;
}

// Aksi penjual atas pesanan lewat API (confirm | cook | ready | complete)
export const aksiPesanan = (tokenPenjual: string, code: string, aksi: string) =>
  panggil("POST", `/merchant/orders/${code}/${aksi}`, tokenPenjual, {});
