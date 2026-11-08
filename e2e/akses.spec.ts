import { expect, test } from "@playwright/test";

// Tanpa sesi: halaman dashboard dialihkan oleh proxy, Route Handler di /api tidak tercakup proxy (pagar sendiri).
test.describe("tanpa sesi", () => {
  for (const path of ["/dashboard", "/menu", "/pesanan", "/laporan", "/admin"]) {
    test(`${path} -> /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login(\?|$)/);
    });
  }

  test("/api/dashboard/sinkron -> /login?alasan=sesi-habis", async ({ page }) => {
    await page.goto("/api/dashboard/sinkron?sejak=2026-01-01T00:00:00Z");
    await expect(page).toHaveURL(/\/login\?alasan=sesi-habis/);
  });

  test("/api/pesanan/X/wa -> /login?alasan=sesi-habis", async ({ page }) => {
    await page.goto("/api/pesanan/KK-X/wa");
    await expect(page).toHaveURL(/\/login\?alasan=sesi-habis/);
  });

  test("/api/laporan/csv -> 401", async ({ request }) => {
    const res = await request.get("/api/laporan/csv?dari=2026-01-01&sampai=2026-01-31");
    expect(res.status()).toBe(401);
  });
});
