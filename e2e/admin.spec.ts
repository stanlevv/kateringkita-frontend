import { expect, test } from "@playwright/test";
import { ADMIN, daftarPenjual, masukLewatForm, penjualKe, siapHidrasi } from "./bantu";

// A-05: toko baru berstatus Menunggu sampai admin memverifikasinya di /admin/verifikasi.
test("admin memverifikasi toko baru", async ({ page }) => {
  const penjual = penjualKe(1);
  await daftarPenjual(penjual);

  await masukLewatForm(page, ADMIN.phone);
  await expect(page).toHaveURL(/\/admin/);

  await page.goto("/admin/verifikasi");
  const toko = page.getByRole("link", { name: penjual.business_name, exact: true });
  const kartu = page.getByRole("listitem").filter({ has: toko });
  await expect(kartu.getByText("Menunggu", { exact: true })).toBeVisible();

  const verifikasi = kartu.getByRole("button", { name: "Verifikasi", exact: true });
  await siapHidrasi(verifikasi);
  await verifikasi.click();
  // Toko baru belum punya menu dan titik temu, jadi checklist belum lengkap dan admin diminta menegaskan.
  await page.getByRole("button", { name: "Tetap verifikasi" }).click();
  await expect(page.getByText("Penjual terverifikasi.")).toBeVisible();
  await expect(kartu).toHaveCount(0); // keluar dari antrean

  await page.goto(`/admin/penjual?q=${encodeURIComponent(penjual.business_name)}`);
  const baris = page.getByRole("row").filter({ has: toko });
  await expect(baris.getByText("Terverifikasi")).toBeVisible();
});
