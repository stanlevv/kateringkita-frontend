import { randomUUID } from "node:crypto";
import { expect, type Locator, type Page } from "@playwright/test";

// Semua nilai di sini hanya untuk DB lokal sekali-pakai `kateringkita_e2e`.
// E2E_DATABASE_URL untuk MySQL lokal dengan kredensial lain (mis. Laragon: root tanpa sandi); nama DB tetap harus *_e2e.
export const DB_URL = process.env.E2E_DATABASE_URL ?? "mysql://root:root@127.0.0.1:3306/kateringkita_e2e";
export const TEST_JWT_SECRET = "kunci-uji-e2e-hanya-lokal-0123456789-abcdef";
export const API_PORT = 5050;
export const WEB_PORT = 3050;
export const API = `http://localhost:${API_PORT}/api/v1`;

export const TEST_PASSWORD = "rahasia123";
export const ADMIN = { phone: "081200000001", fullName: "Admin Uji", password: TEST_PASSWORD };
// Satu DB dipakai semua spek: tiap spek mendaftar akunnya sendiri dengan nomor urut berbeda.
export const testMerchant = (index: number) => ({
  full_name: `Penjual ${index}`,
  email: `penjual${index}@mail.com`,
  phone: `0812900${String(index).padStart(4, "0")}`,
  password: TEST_PASSWORD,
  business_name: `Dapur Uji ${index}`,
  merchant_type_id: 1,
  address: "Jl. Mawar 1",
});
export const testCustomer = (index: number) => ({
  full_name: `Pembeli ${index}`,
  email: `pembeli${index}@mail.com`,
  phone: `0812800${String(index).padStart(4, "0")}`,
  password: TEST_PASSWORD,
});
export type TestMerchant = ReturnType<typeof testMerchant>;

// env backend harus terisi sebelum kode be/ diimpor (env.ts membaca process.env saat dimuat)
export function setBackendEnv() {
  Object.assign(process.env, { DATABASE_URL: DB_URL, JWT_SECRET: TEST_JWT_SECRET, NODE_ENV: "development" });
}

async function callApi<T>(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
  extra: Record<string, string> = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${JSON.stringify(json)}`);
  return json?.data as T;
}

// Dipanggil sekali per DB oleh global-setup.ts (nomor admin unik); kolam koneksi dibiarkan, prosesnya langsung keluar.
export async function createTestAdmin(): Promise<void> {
  setBackendEnv();
  const { createAdmin } = await import("../../be/src/scripts/create-admin");
  await createAdmin(ADMIN);
}

export const registerMerchant = (merchant: TestMerchant) =>
  callApi("POST", "/auth/merchant/register", undefined, merchant);
export const registerCustomer = (customer: ReturnType<typeof testCustomer>) =>
  callApi("POST", "/auth/customer/register", undefined, customer);

export async function login(identifier: string): Promise<string> {
  return (
    await callApi<{ token: string }>("POST", "/auth/login", undefined, {
      identifier,
      password: TEST_PASSWORD,
      client: "web",
    })
  ).token;
}

// Masuk lewat formulir /login yang asli; selesai setelah pindah dari halaman login.
export async function loginViaForm(page: Page, identifier: string): Promise<void> {
  await page.goto("/login");
  await waitForHydration(page.getByRole("button", { name: "Masuk" }));
  await page.getByLabel("Email atau nomor WA").fill(identifier);
  await page.getByLabel(/^Kata sandi/).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

// HTML dari server sudah tampil sebelum React terpasang (next dev): klik/isian saat itu hilang percuma.
// React menempelkan __reactProps$ pada elemen yang sudah terhidrasi; tunggu tanda itu, tanpa jeda tetap.
export const waitForHydration = (element: Locator) =>
  expect
    .poll(() => element.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))), {
      timeout: 20_000,
    })
    .toBe(true);

export const todayWib = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

export async function verifyMerchant(adminToken: string, merchant: TestMerchant): Promise<void> {
  const queue = await callApi<{ id: number; business_name: string }[]>("GET", "/admin/verification-queue", adminToken);
  const store = queue.find((entry) => entry.business_name === merchant.business_name); // sama persis: "Dapur Uji 1" bukan "Dapur Uji 10"
  if (!store) throw new Error(`Toko "${merchant.business_name}" tidak ada di antrean verifikasi`);
  const id = store.id;
  await callApi("POST", `/admin/merchants/${id}/verify`, adminToken, {});
}

// Penjual terverifikasi admin, buka 24 jam (tes tidak bergantung jam nyata), melayani titik temu 1, dengan satu menu.
export async function prepareStore(
  adminToken: string,
  merchantToken: string,
  merchant: TestMerchant,
): Promise<{ menuId: number }> {
  await verifyMerchant(adminToken, merchant);
  await callApi("PATCH", "/merchant/profile", merchantToken, {
    open_time: "00:00",
    close_time: "23:59",
    pickup_point_ids: [1],
  });
  const menu = await callApi<{ id: number }>("POST", "/merchant/menus", merchantToken, {
    name: "Nasi Ayam",
    category_id: 1,
    unit_label: "porsi",
    price: 15000,
    hpp: 9000,
    daily_quota: 20,
    prep_minutes: 15,
    is_preorder: false,
    preorder_days: 0,
    min_order_qty: 1,
  });
  return { menuId: menu.id };
}

// Checkout pembeli (tunai) lewat API -> kode pesanan
export async function placeOrder(customerToken: string, menuId: number, qty = 1): Promise<string> {
  const order = await callApi<{ code: string }>(
    "POST",
    "/orders",
    customerToken,
    {
      items: [{ menu_id: menuId, qty }],
      pickup_point_id: 1,
      payment_method: "cod",
    },
    { "Idempotency-Key": randomUUID() },
  );
  return order.code;
}

// Aksi penjual atas pesanan lewat API (confirm | cook | ready | complete)
export const applyOrderAction = (merchantToken: string, code: string, action: string) =>
  callApi("POST", `/merchant/orders/${code}/${action}`, merchantToken, {});
