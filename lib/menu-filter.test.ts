import { describe, expect, it } from "vitest";
import { menus } from "./fixtures/menus";
import { countMenuTabs, marginPercent, filterMenus, filterBySearchAndCategory } from "./menu-filter";

const allMenus = menus();

describe("MN-N2 saring & hitung tab", () => {
  it("tab: Nonaktif = !is_active, Habis/Menipis hanya menu aktif, Aktif = semua yang aktif", () => {
    const counts = countMenuTabs(allMenus);
    expect(counts.semua).toBe(12);
    expect(counts.nonaktif).toBe(1); // id 9
    expect(counts.aktif).toBe(11);
    expect(counts.habis).toBe(allMenus.filter((menu) => menu.is_active && menu.available <= 0).length);
    expect(counts.menipis).toBe(
      allMenus.filter((menu) => menu.is_active && menu.available > 0 && menu.available <= 3).length,
    );
    expect(counts.habis).toBeGreaterThan(0);
    expect(counts.menipis).toBeGreaterThan(0);
  });
  it("q mencari nama tanpa peduli huruf besar", () => {
    expect(filterMenus(allMenus, { q: "TEH", category: "", status: "semua" }).map((menu) => menu.name)).toEqual([
      "Es Teh Manis Jumbo",
    ]);
  });
  it("kategori memakai slug; digabung dengan status", () => {
    expect(filterMenus(allMenus, { q: "", category: "minuman", status: "semua" })).toHaveLength(3);
    expect(filterMenus(allMenus, { q: "", category: "snack", status: "nonaktif" }).map((menu) => menu.id)).toEqual([9]);
  });
  it("hitungTab mengikuti q dan kategori, bukan tab", () => {
    expect(countMenuTabs(filterBySearchAndCategory(allMenus, { q: "", category: "minuman" })).semua).toBe(3);
  });
  it("margin = (harga - hpp) / harga dibulatkan", () => {
    expect(marginPercent({ price: 22000, hpp: 14000 })).toBe(36);
    expect(marginPercent({ price: 6000, hpp: 2000 })).toBe(67);
    expect(marginPercent({ price: 0, hpp: 0 })).toBe(0);
  });
});
