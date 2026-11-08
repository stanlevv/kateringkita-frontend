import { expect, test } from "@playwright/test";
import { ADMIN, daftarPembeli, daftarPenjual, masuk, masukLewatForm, pembeliKe, penjualKe, pesan, siapkanToko } from "./bantu";

// M-04, M-05: pesanan masuk ke dashboard tanpa muat ulang, diproses sampai selesai, dan Chat WA mengarah ke wa.me.
test("pesanan baru muncul sendiri lalu diproses sampai selesai", async ({ page, context }) => {
  test.setTimeout(180_000);
  const penjual = penjualKe(3);
  const pembeli = pembeliKe(3);
  await daftarPenjual(penjual);
  await daftarPembeli(pembeli);
  const { menuId } = await siapkanToko(await masuk(ADMIN.phone), await masuk(penjual.phone), penjual);
  const tokenPembeli = await masuk(pembeli.phone);

  await masukLewatForm(page, penjual.phone);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Belum ada pesanan" })).toBeVisible();

  // Pembeli checkout; dashboard menyinkronkan tiap 5 dtk, jadi kartu harus muncul tanpa muat ulang.
  // Penanda di window hilang kalau halaman dimuat ulang atau berpindah.
  await page.evaluate(() => { (window as unknown as { __tanpaMuat: boolean }).__tanpaMuat = true; });
  let sinkron = 0;
  page.on("response", (r) => { if (new URL(r.url()).pathname === "/api/dashboard/sinkron") sinkron++; });
  const kode = await pesan(tokenPembeli, menuId);
  const sebelum = sinkron;
  const kartu = page.getByRole("article", { name: `Pesanan ${kode}` });
  await expect(kartu).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => sinkron).toBeGreaterThan(sebelum); // kartu datang lewat sinkron setelah checkout
  expect(await page.evaluate(() => (window as unknown as { __tanpaMuat?: boolean }).__tanpaMuat)).toBe(true);
  await expect(kartu.getByText("Menunggu konfirmasi")).toBeVisible();

  // Redirect /api/pesanan/<kode>/wa diambil tanpa diikuti (route.fetch) agar WhatsApp tidak terbuka.
  // Jaring pengaman: permintaan ke luar localhost digagalkan.
  const tujuan: (string | undefined)[] = [];
  const keluar: string[] = [];
  await context.route((u) => u.hostname !== "localhost", (r) => {
    keluar.push(r.request().url());
    return r.abort();
  });
  await context.route(`**/api/pesanan/${kode}/wa`, async (r) => {
    const res = await r.fetch({ maxRedirects: 0 });
    tujuan.push(res.headers().location);
    await r.fulfill({ contentType: "text/html", body: "dicegat" });
  });
  await kartu.getByRole("link", { name: "Chat WA" }).click();
  await expect.poll(() => tujuan.length, { timeout: 20_000 }).toBe(1);
  expect(tujuan[0]).toMatch(new RegExp(`^https://wa\\.me/62${pembeli.phone.slice(1)}(\\?|$)`));
  expect(keluar).toEqual([]);
  for (const p of context.pages()) if (p !== page) await p.close();

  // Aksi ditunda 5 dtk (bisa dibatalkan); tombol berikutnya aktif setelah server menjawab.
  await page.getByRole("tab", { name: /Semua hari ini/ }).click();
  for (const [aksi, status] of [["Konfirmasi", "Dikonfirmasi"], ["Mulai masak", "Dimasak"], ["Siap diambil", "Siap diambil"]] as const) {
    await kartu.getByRole("button", { name: aksi, exact: true }).click();
    await expect(kartu.getByText(status, { exact: true })).toBeVisible();
    await expect(kartu.locator("[data-aksi-utama]")).toBeEnabled({ timeout: 20_000 });
  }
  // Server Action terakhir terkirim setelah jeda Batalkan 5 dtk; baru sesudahnya muat ulang aman.
  const terkirim = page.waitForResponse((r) => r.request().method() === "POST" && "next-action" in r.request().headers(), { timeout: 20_000 });
  await kartu.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(kartu.getByText("Selesai", { exact: true })).toBeVisible();
  await terkirim;

  await page.reload();
  await page.getByRole("tab", { name: /Semua hari ini/ }).click();
  await expect(page.getByRole("article", { name: `Pesanan ${kode}` }).getByText("Selesai", { exact: true })).toBeVisible();
});
