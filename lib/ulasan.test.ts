import { describe, expect, it } from "vitest";
import { menus } from "./fixtures/menus";
import { reviews } from "./fixtures/reviews";
import { LIMIT_ULASAN, ringkasPerMenu, ringkasUlasan, samarkanNama, saringUlasan } from "./ulasan";

describe("samarkanNama (R-09)", () => {
  it("dua huruf pertama + ***", () => {
    expect(samarkanNama("Rafli R.")).toBe("Ra***");
    expect(samarkanNama("  budi ")).toBe("bu***");
    expect(samarkanNama("Al")).toBe("Al***");
    expect(samarkanNama("")).toBe("***");
  });
});

describe("ringkasUlasan (UL-N1)", () => {
  it("sebaran 5 sampai 1 berjumlah total; rata-rata 1 desimal", () => {
    const rs = reviews();
    const r = ringkasUlasan(rs);
    expect(r.sebaran.map((s) => s.bintang)).toEqual([5, 4, 3, 2, 1]);
    expect(r.sebaran.reduce((a, s) => a + s.jumlah, 0)).toBe(rs.length);
    expect(r.total).toBe(20);
    expect(r.rata).toBe(Math.round((rs.reduce((a, x) => a + x.rating, 0) / rs.length) * 10) / 10);
  });
  it("kosong -> rata 0", () => {
    expect(ringkasUlasan([])).toMatchObject({ total: 0, rata: 0 });
  });
});

describe("ringkasPerMenu (UL-N2)", () => {
  it("menu tanpa ulasan tetap tampil dengan jumlah 0", () => {
    const rs = reviews();
    const hasil = ringkasPerMenu(rs, menus().map((m) => ({ id: m.id, name: m.name })));
    expect(hasil.reduce((a, m) => a + m.jumlah, 0)).toBe(rs.length);
    expect(hasil.length).toBe(menus().length);
  });
  it("menu yang hanya ada di ulasan tetap ikut", () => {
    const hasil = ringkasPerMenu(reviews(), []);
    expect(hasil.reduce((a, m) => a + m.jumlah, 0)).toBe(20);
  });
});

describe("saringUlasan (UL-N2, UL-N3)", () => {
  const rs = reviews();
  it("menyaring per menu dan bintang, terbaru dulu", () => {
    const id = rs[0].menu_id;
    const r = saringUlasan(rs, { menu: id }, 1);
    expect(r.rows.every((x) => x.menu_id === id)).toBe(true);
    const b = saringUlasan(rs, { bintang: 5 }, 1);
    expect(b.rows.every((x) => x.rating === 5)).toBe(true);
    const t = b.rows.map((x) => Date.parse(x.created_at));
    expect([...t].sort((a, c) => c - a)).toEqual(t);
  });
  it("paginasi 10 per halaman", () => {
    expect(LIMIT_ULASAN).toBe(10);
    const p1 = saringUlasan(rs, {}, 1);
    const p2 = saringUlasan(rs, {}, 2);
    expect(p1.total).toBe(20);
    expect(p1.rows).toHaveLength(10);
    expect(p2.rows).toHaveLength(10);
    expect(new Set([...p1.rows, ...p2.rows].map((x) => x.id)).size).toBe(20);
  });
});
