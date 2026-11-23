// Keranjang di halaman pesan dari meja (fungsi murni, tanpa React).
// Menu yang sama dengan opsi berbeda menjadi baris berbeda. Batas stok dihitung per menu
// (jumlah semua barisnya); backend tetap memeriksa ulang saat pesanan dikirim.

import type { MenuOption } from "@/types/menu";
import type { TableMenuItem } from "@/types/table";

/** Satu baris keranjang: kunci unik (menu + opsi), menu, jumlah, dan opsi yang dipilih. */
export type CartLine = { key: string; menu: TableMenuItem; qty: number; options: MenuOption[] };
/** Bentuk baris keranjang yang disimpan di localStorage dan dikirim saat memesan. */
export type SavedCartLine = { menu_id: number; qty: number; option_ids: number[] };

/**
 * Membuat kunci unik baris keranjang dari id menu dan id opsi (urutan opsi tidak berpengaruh).
 * @param menuId id menu
 * @param optionIds id opsi yang dipilih
 * @returns kunci, mis. "12:3,5"
 */
export const cartLineKey = (menuId: number, optionIds: number[]) =>
  `${menuId}:${[...optionIds].sort((first, second) => first - second).join(",")}`;
/**
 * Harga satu porsi: harga menu ditambah harga semua opsi.
 * @param line baris keranjang (cukup menu dan opsi)
 * @returns harga satu porsi dalam rupiah
 */
export const unitPrice = (line: Pick<CartLine, "menu" | "options">) =>
  line.menu.price + line.options.reduce((sum, option) => sum + option.extra_price, 0);
/**
 * Total harga seluruh keranjang.
 * @param lines isi keranjang
 * @returns total harga dalam rupiah
 */
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + unitPrice(line) * line.qty, 0);
/**
 * Jumlah porsi di keranjang.
 * @param lines isi keranjang
 * @returns jumlah porsi
 */
export const countItems = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.qty, 0);
/**
 * Jumlah porsi satu menu di keranjang, dari semua barisnya.
 * @param lines isi keranjang
 * @param menuId id menu
 * @returns jumlah porsi menu itu
 */
export const menuQty = (lines: CartLine[], menuId: number) =>
  lines.filter((line) => line.menu.id === menuId).reduce((sum, line) => sum + line.qty, 0);

/**
 * Menambah porsi ke keranjang. Baris baru minimal sebanyak `min_order_qty` menu.
 * @param lines isi keranjang sekarang
 * @param menu menu yang ditambah
 * @param options opsi yang dipilih
 * @param qty jumlah porsi yang ditambah
 * @returns keranjang baru, atau null bila melebihi sisa stok
 */
export function addToCart(lines: CartLine[], menu: TableMenuItem, options: MenuOption[], qty = 1): CartLine[] | null {
  const key = cartLineKey(
    menu.id,
    options.map((option) => option.id),
  );
  const existing = lines.find((line) => line.key === key);
  const addedQty = existing ? qty : Math.max(qty, menu.min_order_qty);
  if (menuQty(lines, menu.id) + addedQty > menu.available) return null;
  return existing
    ? lines.map((line) => (line === existing ? { ...line, qty: line.qty + addedQty } : line))
    : [...lines, { key, menu, qty: addedQty, options }];
}

/**
 * Mengubah jumlah porsi satu baris. Di bawah minimum pesan, baris dihapus.
 * @param lines isi keranjang sekarang
 * @param key kunci baris
 * @param qty jumlah baru
 * @returns keranjang baru, atau null bila melebihi sisa stok
 */
export function updateQty(lines: CartLine[], key: string, qty: number): CartLine[] | null {
  const target = lines.find((line) => line.key === key);
  if (!target) return lines;
  if (qty < target.menu.min_order_qty) return lines.filter((line) => line !== target);
  if (menuQty(lines, target.menu.id) - target.qty + qty > target.menu.available) return null;
  return lines.map((line) => (line === target ? { ...line, qty } : line));
}

/**
 * Mengubah keranjang ke bentuk tersimpan (id menu, jumlah, id opsi).
 * @param lines isi keranjang
 * @returns baris dalam bentuk tersimpan
 */
export const toSavedLines = (lines: CartLine[]): SavedCartLine[] =>
  lines.map((line) => ({ menu_id: line.menu.id, qty: line.qty, option_ids: line.options.map((option) => option.id) }));

/**
 * Memulihkan keranjang tersimpan berdasarkan menu terbaru; menu atau opsi yang sudah hilang atau habis dibuang.
 * @param savedLines keranjang dari localStorage
 * @param menus menu terbaru dari server
 * @returns keranjang yang masih valid
 */
export function restoreCart(savedLines: SavedCartLine[], menus: TableMenuItem[]): CartLine[] {
  let cart: CartLine[] = [];
  for (const saved of savedLines) {
    const menu = menus.find((candidate) => candidate.id === saved.menu_id);
    const options = saved.option_ids.map((id) => menu?.options.find((option) => option.id === id));
    if (!menu || options.some((option) => !option) || menu.badge === "sold_out") continue;
    cart = addToCart(cart, menu, options as MenuOption[], saved.qty) ?? cart;
  }
  return cart;
}
