// Test templat pesan WhatsApp: placeholder, pengisian, dan validasi.
import { describe, expect, it } from "vitest";
import { orders } from "./fixtures/orders";
import {
  templateValuesFromOrder,
  findUnknownPlaceholders,
  PLACEHOLDER,
  renderTemplate,
  TEMPLATE_BAWAAN,
} from "./wa-template";

const values = templateValuesFromOrder(orders()[0]);

describe("wa-template", () => {
  it("daftar placeholder lengkap dengan keterangan", () => {
    expect(PLACEHOLDER.map((placeholder) => placeholder.code)).toEqual([
      "{kode}",
      "{nama}",
      "{menu}",
      "{total}",
      "{titik_temu}",
      "{waktu_ambil}",
      "{metode_bayar}",
    ]);
    expect(PLACEHOLDER.every((placeholder) => placeholder.description.length > 0)).toBe(true);
  });
  it("renderTemplate mengisi placeholder", () => {
    const text = renderTemplate("Halo {nama}, pesanan {kode}", values);
    expect(text).toBe(`Halo ${orders()[0].customer_name}, pesanan ${orders()[0].code}`);
  });
  it("renderTemplate membiarkan kata kunci tak dikenal dan mengisi semua kemunculan", () => {
    expect(renderTemplate("{harga} {kode} {kode}", values)).toBe(`{harga} ${orders()[0].code} ${orders()[0].code}`);
  });
  it("findUnknownPlaceholders", () => {
    expect(findUnknownPlaceholders("{harga} {kode} {harga}")).toEqual(["{harga}"]);
    expect(findUnknownPlaceholders("{kode} {nama}")).toEqual([]);
  });
  it("contoh memakai Rupiah dan titik temu pesanan", () => {
    expect(values.total).toMatch(/^Rp /);
    expect(values.titik_temu).toBe(orders()[0].pickup_point!.name);
  });
  it("templat bawaan memakai semua placeholder dan tidak ada yang tak dikenal", () => {
    for (const placeholder of PLACEHOLDER) expect(TEMPLATE_BAWAAN).toContain(placeholder.code);
    expect(findUnknownPlaceholders(TEMPLATE_BAWAAN)).toEqual([]);
    expect(TEMPLATE_BAWAAN.length).toBeLessThanOrEqual(1000);
  });
});
