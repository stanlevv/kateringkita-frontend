import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { ADMIN, aksiPesanan, daftarPembeli, daftarPenjual, hariIniWib, masuk, masukLewatForm, pembeliKe, penjualKe, pesan, siapHidrasi, siapkanToko } from "./bantu";

// M-09: pesanan selesai masuk laporan hari ini dan bisa diunduh sebagai CSV.
test("laporan hari ini memuat pesanan selesai dan CSV-nya", async ({ page }) => {
  const penjual = penjualKe(4);
  const pembeli = pembeliKe(4);
  await daftarPenjual(penjual);
  await daftarPembeli(pembeli);
  const tokenPenjual = await masuk(penjual.phone);
  const { menuId } = await siapkanToko(await masuk(ADMIN.phone), tokenPenjual, penjual);
  const kode = await pesan(await masuk(pembeli.phone), menuId, 2); // 2 x Rp 15.000
  for (const aksi of ["confirm", "cook", "ready", "complete"]) await aksiPesanan(tokenPenjual, kode, aksi);

  await masukLewatForm(page, penjual.phone);
  await page.goto("/laporan");
  const hari = hariIniWib();
  const kpi = (label: string) => page.getByText(label, { exact: true }).locator("xpath=following-sibling::p[1]");
  await expect(kpi("Omzet dan target")).toHaveText("Rp 30.000");
  await expect(kpi("Pesanan selesai")).toHaveText("1");
  await expect(page.getByRole("row").filter({ hasText: kode })).toBeVisible();

  const tombol = page.getByRole("button", { name: "Unduh CSV" });
  await siapHidrasi(tombol);
  const [unduhan] = await Promise.all([page.waitForEvent("download"), tombol.click()]);
  expect(unduhan.suggestedFilename()).toBe(`laporan-${hari}-${hari}.csv`);
  expect(await readFile(await unduhan.path(), "utf8")).toContain(kode);
});
