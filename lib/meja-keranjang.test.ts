import { describe, expect, it } from "vitest";
import type { MenuMejaItem } from "@/types/meja";
import { hargaSatuan, jumlahItem, keItems, pulihkan, qtyMenu, tambah, totalKeranjang, ubahQty } from "./meja-keranjang";

const menu = (o: Partial<MenuMejaItem> = {}): MenuMejaItem => ({
  id: 1, name: "Nasi Ayam", image_url: null, price: 15000, unit_label: "porsi", category: { id: 1, name: "Nasi", slug: "nasi" },
  available: 5, badge: "available", rating_avg: 0, rating_count: 0, description: null, min_order_qty: 1,
  options: [{ id: 7, name: "Keju", extra_price: 3000 }], ...o,
});
const keju = { id: 7, name: "Keju", extra_price: 3000 };

describe("keranjang pesan dari meja", () => {
  it("opsi berbeda = baris berbeda; harga = (menu + opsi) × qty", () => {
    const m = menu();
    const k = tambah(tambah(tambah([], m, [])!, m, [keju])!, m, [keju])!;
    expect(k).toHaveLength(2);
    expect(hargaSatuan(k[1])).toBe(18000);
    expect(totalKeranjang(k)).toBe(15000 + 2 * 18000);
    expect(jumlahItem(k)).toBe(3);
    expect(keItems(k)).toEqual([{ menu_id: 1, qty: 1, option_ids: [] }, { menu_id: 1, qty: 2, option_ids: [7] }]);
  });

  it("stok dihitung per menu lintas baris; melebihi sisa → null", () => {
    const m = menu({ available: 3 });
    const k = tambah(tambah([], m, [], 2)!, m, [keju])!;
    expect(qtyMenu(k, 1)).toBe(3);
    expect(tambah(k, m, [])).toBeNull();
    expect(ubahQty(k, k[0].kunci, 3)).toBeNull();
  });

  it("baris baru minimal min_order_qty; turun di bawah minimum menghapus baris", () => {
    const m = menu({ min_order_qty: 2 });
    const k = tambah([], m, [])!;
    expect(k[0].qty).toBe(2);
    expect(ubahQty(k, k[0].kunci, 1)).toEqual([]);
  });

  it("pulihkan membuang menu hilang, opsi hilang, dan menu habis", () => {
    const m = menu();
    const k = pulihkan(
      [{ menu_id: 1, qty: 2, option_ids: [7] }, { menu_id: 9, qty: 1, option_ids: [] }, { menu_id: 1, qty: 1, option_ids: [99] }],
      [m, menu({ id: 2, badge: "sold_out", available: 0 })],
    );
    expect(keItems(k)).toEqual([{ menu_id: 1, qty: 2, option_ids: [7] }]);
  });
});
