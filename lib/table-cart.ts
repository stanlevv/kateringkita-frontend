import type { MenuOption } from "@/types/menu";
import type { TableMenuItem } from "@/types/table";

// F21 keranjang pesan dari meja (murni, tanpa React). Menu sama dengan opsi berbeda = baris berbeda.
// Batas stok dihitung per menu (jumlah semua barisnya); backend tetap memeriksa ulang saat pesan.
export type CartLine = { key: string; menu: TableMenuItem; qty: number; options: MenuOption[] };
export type SavedCartLine = { menu_id: number; qty: number; option_ids: number[] };

export const cartLineKey = (menuId: number, optionIds: number[]) =>
  `${menuId}:${[...optionIds].sort((first, second) => first - second).join(",")}`;
export const unitPrice = (line: Pick<CartLine, "menu" | "options">) =>
  line.menu.price + line.options.reduce((sum, option) => sum + option.extra_price, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + unitPrice(line) * line.qty, 0);
export const countItems = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.qty, 0);
export const menuQty = (lines: CartLine[], menuId: number) =>
  lines.filter((line) => line.menu.id === menuId).reduce((sum, line) => sum + line.qty, 0);

/** Tambah `qty` porsi; baris baru minimal `min_order_qty`. `null` = melebihi sisa stok. */
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

/** Ubah jumlah baris; di bawah minimum pesan = baris dihapus. `null` = melebihi sisa stok. */
export function updateQty(lines: CartLine[], key: string, qty: number): CartLine[] | null {
  const target = lines.find((line) => line.key === key);
  if (!target) return lines;
  if (qty < target.menu.min_order_qty) return lines.filter((line) => line !== target);
  if (menuQty(lines, target.menu.id) - target.qty + qty > target.menu.available) return null;
  return lines.map((line) => (line === target ? { ...line, qty } : line));
}

export const toSavedLines = (lines: CartLine[]): SavedCartLine[] =>
  lines.map((line) => ({ menu_id: line.menu.id, qty: line.qty, option_ids: line.options.map((option) => option.id) }));

/** Pulihkan keranjang tersimpan terhadap menu terkini; menu/opsi yang hilang atau habis dibuang. */
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
