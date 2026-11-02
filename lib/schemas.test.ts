import { describe, expect, it } from "vitest";
import { cekField, cekProfil, changePasswordSchema, menuFormSchema } from "./schemas";

const profil = { business_name: "Dapur", description: "", logo_url: null, address: "Jl. A", wa_number: "081234567890", service_mode: "both", open_time: "07:00", close_time: "16:00", hold_minutes: 5, daily_revenue_target: 0, qris_image_url: null, pickup_point_ids: [1] };
describe("cekProfil (M-10)", () => {
  it("valid lolos", () => expect(cekProfil(profil)).toEqual({}));
  it("PG-E1 tutup <= buka", () => {
    expect(cekProfil({ ...profil, close_time: "07:00" }).close_time).toBeTruthy();
    expect(cekProfil({ ...profil, close_time: "06:00" }).close_time).toBeTruthy();
  });
  it("PG-E1 tutup<=buka tetap dilaporkan walau field lain salah", () => {
    const e = cekProfil({ ...profil, business_name: "", close_time: "06:00" });
    expect(e.business_name && e.close_time).toBeTruthy();
  });
  it("PG-E1 durasi 0 dan 31 ditolak, 1 dan 30 lolos", () => {
    expect(cekProfil({ ...profil, hold_minutes: 0 }).hold_minutes).toBeTruthy();
    expect(cekProfil({ ...profil, hold_minutes: 31 }).hold_minutes).toBeTruthy();
    expect(cekProfil({ ...profil, hold_minutes: 1.5 }).hold_minutes).toBeTruthy();
    expect(cekProfil({ ...profil, hold_minutes: 30 })).toEqual({});
  });
  it("PG-E1 tanpa titik temu; no WA salah; target negatif", () => {
    expect(cekProfil({ ...profil, pickup_point_ids: [] }).pickup_point_ids).toBe("Pilih minimal satu titik temu.");
    expect(cekProfil({ ...profil, wa_number: "6281234567890" }).wa_number).toBeTruthy();
    expect(cekProfil({ ...profil, daily_revenue_target: -1 }).daily_revenue_target).toBeTruthy();
    expect(cekProfil({ ...profil, daily_revenue_target: 1_000_000_001 }).daily_revenue_target).toBe("Target omzet maksimal 1.000.000.000.");
    expect(cekProfil({ ...profil, daily_revenue_target: 1_000_000_000 }).daily_revenue_target).toBeUndefined();
  });
  it("batas panjang", () => {
    expect(cekProfil({ ...profil, business_name: "a".repeat(151) }).business_name).toBeTruthy();
    expect(cekProfil({ ...profil, description: "a".repeat(501) }).description).toBeTruthy();
    expect(cekProfil({ ...profil, address: "a".repeat(256) }).address).toBeTruthy();
  });
  it("patch sebagian: hanya wa_template; WA-E1/E2", () => {
    expect(cekProfil({ wa_template: "Halo {nama}" }, false)).toEqual({});
    expect(cekProfil({ wa_template: "Halo {harga}" }, false).wa_template).toBe("Kata kunci {harga} tidak dikenal.");
    expect(cekProfil({ wa_template: "  " }, false).wa_template).toBeTruthy();
    expect(cekProfil({ wa_template: "a".repeat(1001) }, false).wa_template).toBeTruthy();
  });
});
describe("changePasswordSchema (PG-N2)", () => {
  it("memakai aturan sandi pendaftaran", () => {
    expect(Object.keys(cekField(changePasswordSchema, { current_password: "x", new_password: "abc" }))).toContain("new_password");
    expect(cekField(changePasswordSchema, { current_password: "x", new_password: "abcd1234" })).toEqual({});
    expect(cekField(changePasswordSchema, { current_password: "", new_password: "abcd1234" }).current_password).toBeTruthy();
    expect(cekField(changePasswordSchema, { current_password: "a".repeat(73), new_password: "abcd1234" }).current_password).toBeTruthy();
  });
  it("sandi baru harus berbeda dari lama", () => {
    expect(cekField(changePasswordSchema, { current_password: "abcd1234", new_password: "abcd1234" }).new_password).toBe("Kata sandi baru harus berbeda dari kata sandi lama.");
  });
});

const ok = { name: "Nasi Box", category_id: 1, description: "", image_url: null, unit_label: "porsi", price: 15000, hpp: 9000, daily_quota: 20, prep_minutes: 15, is_preorder: false, preorder_days: 0, min_order_qty: 1, options: [] as { name: string; extra_price: number }[] };
const cek = (o: object) => cekField(menuFormSchema, { ...ok, ...o });

describe("menuFormSchema (M-07)", () => {
  it("input bukan objek tidak melempar", () => {
    expect(() => cekField(menuFormSchema, null)).not.toThrow();
    expect(Object.keys(cekField(menuFormSchema, null))).not.toHaveLength(0);
  });
  it("isian valid lolos", () => expect(cek({})).toEqual({}));
  it("MF-E1 harga sama dengan HPP", () => {
    expect(cek({ price: 12000, hpp: 12000 }).price).toBe("Harga jual harus lebih besar dari HPP (Rp 12.000).");
  });
  it("batas atas D9 sama dengan backend", () => {
    expect(cek({ price: 100_000_001 }).price).toBe("Harga jual maksimal 100.000.000.");
    expect(cek({ hpp: 100_000_001 }).hpp).toBe("HPP maksimal 100.000.000.");
    expect(cek({ daily_quota: 10_001 }).daily_quota).toBe("Kuota harian maksimal 10.000.");
    expect(cek({ prep_minutes: 1441 }).prep_minutes).toBe("Estimasi siap maksimal 1.440.");
    expect(cek({ min_order_qty: 1001 }).min_order_qty).toBe("Minimum pesan maksimal 1.000.");
    expect(cek({ options: [{ name: "A", extra_price: 1_000_001 }] })["options.0.extra_price"]).toBe("Tambahan harga maksimal 1.000.000.");
    const dua1 = Array.from({ length: 21 }, (_, i) => ({ name: `O${i}`, extra_price: 0 }));
    expect(cek({ options: dua1 }).options).toBe("Maksimal 20 opsi.");
  });
  it("MF-E1 harga di bawah 1.000", () => expect(cek({ price: 900, hpp: 100 }).price).toMatch(/1\.000/));
  it("uang dan kuota harus bilangan bulat", () => {
    expect(cek({ hpp: 100.5 }).hpp).toBeTruthy();
    expect(cek({ daily_quota: 2.5 }).daily_quota).toBeTruthy();
  });
  it("nama wajib dan maks 80", () => {
    expect(cek({ name: " " }).name).toBeTruthy();
    expect(cek({ name: "a".repeat(81) }).name).toBeTruthy();
  });
  it("deskripsi maks 500, satuan maks 30", () => {
    expect(cek({ description: "a".repeat(501) }).description).toBeTruthy();
    expect(cek({ unit_label: "a".repeat(31) }).unit_label).toBeTruthy();
  });
  it("preorder_days 1-7 wajib hanya bila pre-order", () => {
    expect(cek({ is_preorder: false, preorder_days: 0 })).toEqual({});
    expect(cek({ is_preorder: true, preorder_days: 0 }).preorder_days).toBeTruthy();
    expect(cek({ is_preorder: true, preorder_days: 8 }).preorder_days).toBeTruthy();
    expect(cek({ is_preorder: true, preorder_days: 2 })).toEqual({});
  });
  it("MF-E6 opsi bernama sama (tanpa beda huruf) dan opsi kosong menjadi galat per baris", () => {
    const e = cek({ options: [{ name: "Pedas", extra_price: 0 }, { name: " pedas ", extra_price: 0 }, { name: "", extra_price: 0 }] });
    expect(e["options.1.name"]).toBeTruthy();
    expect(e["options.2.name"]).toBeTruthy();
    expect(e["options.0.name"]).toBeUndefined();
  });
  it("tambahan harga opsi tidak boleh negatif, nama opsi maks 60", () => {
    expect(cek({ options: [{ name: "x", extra_price: -1 }] })["options.0.extra_price"]).toBeTruthy();
    expect(cek({ options: [{ name: "a".repeat(61), extra_price: 0 }] })["options.0.name"]).toBeTruthy();
  });
});
