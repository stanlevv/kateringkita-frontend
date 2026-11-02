import { describe, expect, it } from "vitest";
import { menus } from "./fixtures/menus";
import { hitungTab, marginPersen, saring, saringQK } from "./menu-filter";

const semua = menus();

describe("MN-N2 saring & hitung tab", () => {
  it("tab: Nonaktif = !is_active, Habis/Menipis hanya menu aktif, Aktif = semua yang aktif", () => {
    const n = hitungTab(semua);
    expect(n.semua).toBe(12);
    expect(n.nonaktif).toBe(1); // id 9
    expect(n.aktif).toBe(11);
    expect(n.habis).toBe(semua.filter((m) => m.is_active && m.available <= 0).length);
    expect(n.menipis).toBe(semua.filter((m) => m.is_active && m.available > 0 && m.available <= 3).length);
    expect(n.habis).toBeGreaterThan(0);
    expect(n.menipis).toBeGreaterThan(0);
  });
  it("q mencari nama tanpa peduli huruf besar", () => {
    expect(saring(semua, { q: "TEH", kategori: "", status: "semua" }).map((m) => m.name)).toEqual(["Es Teh Manis Jumbo"]);
  });
  it("kategori memakai slug; digabung dengan status", () => {
    expect(saring(semua, { q: "", kategori: "minuman", status: "semua" })).toHaveLength(3);
    expect(saring(semua, { q: "", kategori: "snack", status: "nonaktif" }).map((m) => m.id)).toEqual([9]);
  });
  it("hitungTab mengikuti q dan kategori, bukan tab", () => {
    expect(hitungTab(saringQK(semua, { q: "", kategori: "minuman" })).semua).toBe(3);
  });
  it("margin = (harga - hpp) / harga dibulatkan", () => {
    expect(marginPersen({ price: 22000, hpp: 14000 })).toBe(36);
    expect(marginPersen({ price: 6000, hpp: 2000 })).toBe(67);
    expect(marginPersen({ price: 0, hpp: 0 })).toBe(0);
  });
});
