import { expect, test } from "@playwright/test";
import { ADMIN, registerMerchant, loginViaForm, testMerchant, waitForHydration } from "./helpers";

// Toko baru berstatus Menunggu sampai admin memverifikasinya di /admin/verifikasi.
test("admin memverifikasi toko baru", async ({ page }) => {
  const merchant = testMerchant(1);
  await registerMerchant(merchant);

  await loginViaForm(page, ADMIN.phone);
  await expect(page).toHaveURL(/\/admin/);

  await page.goto("/admin/verifikasi");
  const storeLink = page.getByRole("link", { name: merchant.business_name, exact: true });
  const card = page.getByRole("listitem").filter({ has: storeLink });
  await expect(card.getByText("Menunggu", { exact: true })).toBeVisible();

  const verifyButton = card.getByRole("button", { name: "Verifikasi", exact: true });
  await waitForHydration(verifyButton);
  await verifyButton.click();
  // Toko baru belum punya menu dan titik temu, jadi checklist belum lengkap dan admin diminta menegaskan.
  await page.getByRole("button", { name: "Tetap verifikasi" }).click();
  await expect(page.getByText("Penjual terverifikasi.")).toBeVisible();
  await expect(card).toHaveCount(0); // keluar dari antrean

  await page.goto(`/admin/penjual?q=${encodeURIComponent(merchant.business_name)}`);
  const row = page.getByRole("row").filter({ has: storeLink });
  await expect(row.getByText("Terverifikasi")).toBeVisible();
});
