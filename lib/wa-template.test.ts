import { describe, expect, it } from "vitest";
import { orders } from "./fixtures/orders";
import { contohDariPesanan, findUnknownPlaceholders, PLACEHOLDER, renderTemplate, TEMPLATE_BAWAAN } from "./wa-template";

const contoh = contohDariPesanan(orders()[0]);

describe("wa-template (M-11)", () => {
  it("WA-N1 daftar placeholder lengkap dengan keterangan", () => {
    expect(PLACEHOLDER.map((p) => p.kode)).toEqual(["{kode}", "{nama}", "{menu}", "{total}", "{titik_temu}", "{waktu_ambil}", "{metode_bayar}"]);
    expect(PLACEHOLDER.every((p) => p.deskripsi.length > 0)).toBe(true);
  });
  it("WA-N2 renderTemplate mengisi placeholder", () => {
    const t = renderTemplate("Halo {nama}, pesanan {kode}", contoh);
    expect(t).toBe(`Halo ${orders()[0].customer_name}, pesanan ${orders()[0].code}`);
  });
  it("renderTemplate membiarkan kata kunci tak dikenal dan mengisi semua kemunculan", () => {
    expect(renderTemplate("{harga} {kode} {kode}", contoh)).toBe(`{harga} ${orders()[0].code} ${orders()[0].code}`);
  });
  it("WA-E1 findUnknownPlaceholders", () => {
    expect(findUnknownPlaceholders("{harga} {kode} {harga}")).toEqual(["{harga}"]);
    expect(findUnknownPlaceholders("{kode} {nama}")).toEqual([]);
  });
  it("contoh memakai Rupiah dan titik temu pesanan", () => {
    expect(contoh.total).toMatch(/^Rp /);
    expect(contoh.titik_temu).toBe(orders()[0].pickup_point.name);
  });
  it("templat bawaan memakai semua placeholder dan tidak ada yang tak dikenal", () => {
    for (const p of PLACEHOLDER) expect(TEMPLATE_BAWAAN).toContain(p.kode);
    expect(findUnknownPlaceholders(TEMPLATE_BAWAAN)).toEqual([]);
    expect(TEMPLATE_BAWAAN.length).toBeLessThanOrEqual(1000);
  });
});
