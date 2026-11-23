import { describe, expect, it } from "vitest";
import type { TableMenuItem } from "@/types/table";
import {
  unitPrice,
  countItems,
  toSavedLines,
  restoreCart,
  menuQty,
  addToCart,
  cartTotal,
  updateQty,
} from "./table-cart";

const menu = (overrides: Partial<TableMenuItem> = {}): TableMenuItem => ({
  id: 1,
  name: "Nasi Ayam",
  image_url: null,
  price: 15000,
  unit_label: "porsi",
  category: { id: 1, name: "Nasi", slug: "nasi" },
  available: 5,
  badge: "available",
  rating_avg: 0,
  rating_count: 0,
  description: null,
  min_order_qty: 1,
  options: [{ id: 7, name: "Keju", extra_price: 3000 }],
  ...overrides,
});
const keju = { id: 7, name: "Keju", extra_price: 3000 };

describe("keranjang pesan dari meja", () => {
  it("opsi berbeda = baris berbeda; harga = (menu + opsi) × qty", () => {
    const menuItem = menu();
    const cart = addToCart(addToCart(addToCart([], menuItem, [])!, menuItem, [keju])!, menuItem, [keju])!;
    expect(cart).toHaveLength(2);
    expect(unitPrice(cart[1])).toBe(18000);
    expect(cartTotal(cart)).toBe(15000 + 2 * 18000);
    expect(countItems(cart)).toBe(3);
    expect(toSavedLines(cart)).toEqual([
      { menu_id: 1, qty: 1, option_ids: [] },
      { menu_id: 1, qty: 2, option_ids: [7] },
    ]);
  });

  it("stok dihitung per menu lintas baris; melebihi sisa → null", () => {
    const menuItem = menu({ available: 3 });
    const cart = addToCart(addToCart([], menuItem, [], 2)!, menuItem, [keju])!;
    expect(menuQty(cart, 1)).toBe(3);
    expect(addToCart(cart, menuItem, [])).toBeNull();
    expect(updateQty(cart, cart[0].key, 3)).toBeNull();
  });

  it("baris baru minimal min_order_qty; turun di bawah minimum menghapus baris", () => {
    const menuItem = menu({ min_order_qty: 2 });
    const cart = addToCart([], menuItem, [])!;
    expect(cart[0].qty).toBe(2);
    expect(updateQty(cart, cart[0].key, 1)).toEqual([]);
  });

  it("pulihkan membuang menu hilang, opsi hilang, dan menu habis", () => {
    const menuItem = menu();
    const cart = restoreCart(
      [
        { menu_id: 1, qty: 2, option_ids: [7] },
        { menu_id: 9, qty: 1, option_ids: [] },
        { menu_id: 1, qty: 1, option_ids: [99] },
      ],
      [menuItem, menu({ id: 2, badge: "sold_out", available: 0 })],
    );
    expect(toSavedLines(cart)).toEqual([{ menu_id: 1, qty: 2, option_ids: [7] }]);
  });
});
