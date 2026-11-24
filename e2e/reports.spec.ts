import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  ADMIN,
  applyOrderAction,
  registerCustomer,
  registerMerchant,
  todayWib,
  login,
  loginViaForm,
  testCustomer,
  testMerchant,
  placeOrder,
  waitForHydration,
  prepareStore,
} from "./helpers";

// Pesanan selesai masuk laporan hari ini dan bisa diunduh sebagai CSV.
test("laporan hari ini memuat pesanan selesai dan CSV-nya", async ({ page }) => {
  const merchant = testMerchant(4);
  const customer = testCustomer(4);
  await registerMerchant(merchant);
  await registerCustomer(customer);
  const merchantToken = await login(merchant.phone);
  const { menuId } = await prepareStore(await login(ADMIN.phone), merchantToken, merchant);
  const orderCode = await placeOrder(await login(customer.phone), menuId, 2); // 2 x Rp 15.000
  for (const action of ["confirm", "cook", "ready", "complete"])
    await applyOrderAction(merchantToken, orderCode, action);

  await loginViaForm(page, merchant.phone);
  await page.goto("/laporan");
  const today = todayWib();
  const kpi = (label: string) => page.getByText(label, { exact: true }).locator("xpath=following-sibling::p[1]");
  await expect(kpi("Omzet dan target")).toHaveText("Rp 30.000");
  await expect(kpi("Pesanan selesai")).toHaveText("1");
  await expect(page.getByRole("row").filter({ hasText: orderCode })).toBeVisible();

  const downloadButton = page.getByRole("button", { name: "Unduh CSV" });
  await waitForHydration(downloadButton);
  const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
  expect(download.suggestedFilename()).toBe(`laporan-${today}-${today}.csv`);
  expect(await readFile(await download.path(), "utf8")).toContain(orderCode);
});
