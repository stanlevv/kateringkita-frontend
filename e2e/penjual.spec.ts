import { expect, test } from "@playwright/test";
import { ADMIN, daftarPenjual, masuk, masukLewatForm, penjualKe, siapHidrasi, verifikasiPenjual } from "./bantu";

test.describe("penjual", () => {
  test.describe.configure({ mode: "serial" }); // beforeAll mendaftar akun: tidak boleh diulang setelah satu tes gagal
  const penjual = penjualKe(2);

  test.beforeAll(async () => {
    await daftarPenjual(penjual);
    await verifikasiPenjual(await masuk(ADMIN.phone), penjual);
  });

  test.beforeEach(async ({ page }) => {
    await masukLewatForm(page, penjual.phone);
  });

  test("menu baru muncul di daftar menu", async ({ page }) => {
    await page.goto("/menu/baru");
    await siapHidrasi(page.getByLabel("Nama menu"));
    await page.getByLabel("Nama menu").fill("Nasi Kotak Ayam");
    await page.getByLabel("Kategori").selectOption({ index: 1 });
    await page.getByLabel("HPP (Rp)").fill("9000");
    await page.getByLabel("Harga jual (Rp)").fill("15000");
    await page.getByRole("button", { name: "Simpan menu" }).click();

    await expect(page).toHaveURL(/\/menu$/);
    const kartu = page.getByRole("article", { name: "Nasi Kotak Ayam" });
    await expect(kartu).toBeVisible();
    await expect(kartu.getByText("Rp 15.000")).toBeVisible();
  });

  test("buka toko dan simpan deskripsi", async ({ page }) => {
    await page.goto("/pengaturan");
    // Toko baru sudah Buka: tutup dulu (dengan konfirmasi), lalu buka lagi.
    const saklar = page.getByRole("switch", { name: /Status dapur/ }).filter({ visible: true });
    await siapHidrasi(saklar);
    await saklar.click();
    await page.getByRole("button", { name: "Tutup dapur", exact: true }).click();
    await expect(saklar).not.toBeChecked();
    await saklar.click();
    await expect(saklar).toBeChecked();

    const deskripsi = "Masakan rumahan tanpa pengawet.";
    await siapHidrasi(page.getByLabel("Deskripsi", { exact: true }));
    await page.getByLabel("Deskripsi", { exact: true }).fill(deskripsi);
    await page.getByRole("checkbox", { name: "Kantin Vokasi UB" }).check(); // toko baru belum punya titik temu
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Pengaturan disimpan")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Deskripsi", { exact: true })).toHaveValue(deskripsi);
    await expect(page.getByRole("switch", { name: /Status dapur/ }).filter({ visible: true })).toBeChecked();
  });

  test("skenario kosong di /pratinjau mengosongkan data, dan bisa dihapus", async ({ page, context }) => {
    // Toko ini sudah punya menu dari tes pertama, jadi "kosong" hanya terlihat bila skenario benar-benar aktif.
    await page.goto("/menu");
    await expect(page.getByRole("article", { name: "Nasi Kotak Ayam" })).toBeVisible();

    await page.goto("/pratinjau");
    await page.getByRole("link", { name: /Data kosong/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Belum ada pesanan" })).toBeVisible();
    expect((await context.cookies()).find((c) => c.name === "kk_skenario")?.value).toBe("kosong");
    await page.goto("/menu");
    await expect(page.getByRole("heading", { name: "Belum ada menu" })).toBeVisible();
    await expect(page.getByRole("article", { name: "Nasi Kotak Ayam" })).toHaveCount(0);

    await page.goto("/api/skenario?nilai=hapus&ke=/menu"); // skenario dihapus: data asli kembali
    expect((await context.cookies()).some((c) => c.name === "kk_skenario")).toBe(false);
    await expect(page.getByRole("article", { name: "Nasi Kotak Ayam" })).toBeVisible();
  });
});
