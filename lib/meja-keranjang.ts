import type { MenuOption } from "@/types/menu";
import type { MenuMejaItem } from "@/types/meja";

// F21 keranjang pesan dari meja (murni, tanpa React). Menu sama dengan opsi berbeda = baris berbeda.
// Batas stok dihitung per menu (jumlah semua barisnya); backend tetap memeriksa ulang saat pesan.
export type Baris = { kunci: string; menu: MenuMejaItem; qty: number; opsi: MenuOption[] };
export type BarisTersimpan = { menu_id: number; qty: number; option_ids: number[] };

export const kunciBaris = (menuId: number, opsiIds: number[]) => `${menuId}:${[...opsiIds].sort((a, b) => a - b).join(",")}`;
export const hargaSatuan = (b: Pick<Baris, "menu" | "opsi">) => b.menu.price + b.opsi.reduce((s, o) => s + o.extra_price, 0);
export const totalKeranjang = (baris: Baris[]) => baris.reduce((s, b) => s + hargaSatuan(b) * b.qty, 0);
export const jumlahItem = (baris: Baris[]) => baris.reduce((s, b) => s + b.qty, 0);
export const qtyMenu = (baris: Baris[], menuId: number) => baris.filter((b) => b.menu.id === menuId).reduce((s, b) => s + b.qty, 0);

/** Tambah `qty` porsi; baris baru minimal `min_order_qty`. `null` = melebihi sisa stok. */
export function tambah(baris: Baris[], menu: MenuMejaItem, opsi: MenuOption[], qty = 1): Baris[] | null {
  const kunci = kunciBaris(menu.id, opsi.map((o) => o.id));
  const ada = baris.find((b) => b.kunci === kunci);
  const naik = ada ? qty : Math.max(qty, menu.min_order_qty);
  if (qtyMenu(baris, menu.id) + naik > menu.available) return null;
  return ada ? baris.map((b) => (b === ada ? { ...b, qty: b.qty + naik } : b)) : [...baris, { kunci, menu, qty: naik, opsi }];
}

/** Ubah jumlah baris; di bawah minimum pesan = baris dihapus. `null` = melebihi sisa stok. */
export function ubahQty(baris: Baris[], kunci: string, qty: number): Baris[] | null {
  const b = baris.find((x) => x.kunci === kunci);
  if (!b) return baris;
  if (qty < b.menu.min_order_qty) return baris.filter((x) => x !== b);
  if (qtyMenu(baris, b.menu.id) - b.qty + qty > b.menu.available) return null;
  return baris.map((x) => (x === b ? { ...x, qty } : x));
}

export const keItems = (baris: Baris[]): BarisTersimpan[] =>
  baris.map((b) => ({ menu_id: b.menu.id, qty: b.qty, option_ids: b.opsi.map((o) => o.id) }));

/** Pulihkan keranjang tersimpan terhadap menu terkini; menu/opsi yang hilang atau habis dibuang. */
export function pulihkan(simpan: BarisTersimpan[], menus: MenuMejaItem[]): Baris[] {
  let hasil: Baris[] = [];
  for (const s of simpan) {
    const menu = menus.find((m) => m.id === s.menu_id);
    const opsi = s.option_ids.map((id) => menu?.options.find((o) => o.id === id));
    if (!menu || opsi.some((o) => !o) || menu.badge === "sold_out") continue;
    hasil = tambah(hasil, menu, opsi as MenuOption[], s.qty) ?? hasil;
  }
  return hasil;
}
