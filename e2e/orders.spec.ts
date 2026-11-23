import { expect, test } from "@playwright/test";
import {
  ADMIN,
  registerCustomer,
  registerMerchant,
  login,
  loginViaForm,
  testCustomer,
  testMerchant,
  placeOrder,
  prepareStore,
} from "./helpers";

// Pesanan masuk ke dashboard tanpa muat ulang, diproses sampai selesai, dan Chat WA mengarah ke wa.me.
test("pesanan baru muncul sendiri lalu diproses sampai selesai", async ({ page, context }) => {
  test.setTimeout(180_000);
  const merchant = testMerchant(3);
  const customer = testCustomer(3);
  await registerMerchant(merchant);
  await registerCustomer(customer);
  const { menuId } = await prepareStore(await login(ADMIN.phone), await login(merchant.phone), merchant);
  const customerToken = await login(customer.phone);

  await loginViaForm(page, merchant.phone);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Belum ada pesanan" })).toBeVisible();

  // Pembeli checkout; dashboard menyinkronkan tiap 5 dtk, jadi kartu harus muncul tanpa muat ulang.
  // Penanda di window hilang kalau halaman dimuat ulang atau berpindah.
  await page.evaluate(() => {
    (window as unknown as { __noReload: boolean }).__noReload = true;
  });
  let syncCount = 0;
  page.on("response", (response) => {
    if (new URL(response.url()).pathname === "/api/dashboard/sinkron") syncCount++;
  });
  const orderCode = await placeOrder(customerToken, menuId);
  const syncBefore = syncCount;
  const card = page.getByRole("article", { name: `Pesanan ${orderCode}` });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => syncCount).toBeGreaterThan(syncBefore); // kartu datang lewat sinkron setelah checkout
  expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
  await expect(card.getByText("Menunggu konfirmasi")).toBeVisible();

  // Redirect /api/pesanan/<kode>/wa diambil tanpa diikuti (route.fetch) agar WhatsApp tidak terbuka.
  // Jaring pengaman: permintaan ke luar localhost digagalkan.
  const redirectTargets: (string | undefined)[] = [];
  const outgoing: string[] = [];
  await context.route(
    (url) => url.hostname !== "localhost",
    (route) => {
      outgoing.push(route.request().url());
      return route.abort();
    },
  );
  await context.route(`**/api/pesanan/${orderCode}/wa`, async (route) => {
    const response = await route.fetch({ maxRedirects: 0 });
    redirectTargets.push(response.headers().location);
    await route.fulfill({ contentType: "text/html", body: "dicegat" });
  });
  await card.getByRole("link", { name: "Chat WA" }).click();
  await expect.poll(() => redirectTargets.length, { timeout: 20_000 }).toBe(1);
  expect(redirectTargets[0]).toMatch(new RegExp(`^https://wa\\.me/62${customer.phone.slice(1)}(\\?|$)`));
  expect(outgoing).toEqual([]);
  for (const otherPage of context.pages()) if (otherPage !== page) await otherPage.close();

  // Aksi ditunda 5 dtk (bisa dibatalkan); tombol berikutnya aktif setelah server menjawab.
  await page.getByRole("tab", { name: /Semua hari ini/ }).click();
  for (const [action, status] of [
    ["Konfirmasi", "Dikonfirmasi"],
    ["Mulai masak", "Dimasak"],
    ["Siap diambil", "Siap diambil"],
  ] as const) {
    await card.getByRole("button", { name: action, exact: true }).click();
    await expect(card.getByText(status, { exact: true })).toBeVisible();
    await expect(card.locator("[data-aksi-utama]")).toBeEnabled({ timeout: 20_000 });
  }
  // Server Action terakhir terkirim setelah jeda Batalkan 5 dtk; baru sesudahnya muat ulang aman.
  const sent = page.waitForResponse(
    (response) => response.request().method() === "POST" && "next-action" in response.request().headers(),
    { timeout: 20_000 },
  );
  await card.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(card.getByText("Selesai", { exact: true })).toBeVisible();
  await sent;

  await page.reload();
  await page.getByRole("tab", { name: /Semua hari ini/ }).click();
  await expect(
    page.getByRole("article", { name: `Pesanan ${orderCode}` }).getByText("Selesai", { exact: true }),
  ).toBeVisible();
});
