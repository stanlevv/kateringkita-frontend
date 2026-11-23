// Penyaring daftar menu di halaman Menu penjual: pencarian nama, kategori, dan tab status stok.

import { menuStockLevel } from "./dashboard";
import type { MerchantMenu } from "@/types/menu";

/** Tab status di halaman Menu. Nilainya juga dipakai di URL, jadi tetap bahasa Indonesia. */
export type MenuStatusFilter = "semua" | "aktif" | "menipis" | "habis" | "nonaktif";
/** Isian penyaring: kata pencarian (`q`), slug kategori, dan tab status. */
export type MenuFilter = { q: string; category: string; status: MenuStatusFilter };

/** Urutan tab status di halaman Menu. */
export const MENU_STATUS_FILTERS: MenuStatusFilter[] = ["semua", "aktif", "menipis", "habis", "nonaktif"];

// Aturan tiap tab. "Aktif" = semua menu aktif, jadi jumlahnya tumpang tindih dengan Menipis/Habis (sama seperti filter status di API).
const matchesStatus: Record<MenuStatusFilter, (menu: MerchantMenu) => boolean> = {
  semua: () => true,
  aktif: (menu) => menu.is_active,
  menipis: (menu) => menu.is_active && menuStockLevel(menu) === "menipis",
  habis: (menu) => menu.is_active && menuStockLevel(menu) === "habis",
  nonaktif: (menu) => !menu.is_active,
};

const matchSearchAndCategory = (menus: MerchantMenu[], filter: Pick<MenuFilter, "q" | "category">) => {
  const query = filter.q.trim().toLowerCase();
  return menus.filter(
    (menu) =>
      (!query || menu.name.toLowerCase().includes(query)) &&
      (!filter.category || menu.category.slug === filter.category),
  );
};

/**
 * Menyaring menu berdasarkan pencarian, kategori, dan tab status sekaligus.
 * @param menus semua menu
 * @param filter isian penyaring
 */
export const filterMenus = (menus: MerchantMenu[], filter: MenuFilter) =>
  matchSearchAndCategory(menus, filter).filter(matchesStatus[filter.status]);

/**
 * Menghitung jumlah menu di tiap tab status (angka di samping nama tab).
 * Panggil dengan menu yang sudah disaring pencarian dan kategori, bukan yang sudah disaring tab.
 * @param menus menu yang akan dihitung
 */
export function countMenuTabs(menus: MerchantMenu[]): Record<MenuStatusFilter, number> {
  return Object.fromEntries(
    MENU_STATUS_FILTERS.map((status) => [status, menus.filter(matchesStatus[status]).length]),
  ) as Record<MenuStatusFilter, number>;
}

/**
 * Menyaring menu hanya berdasarkan pencarian nama dan kategori (tanpa tab status).
 * @param menus semua menu
 * @param filter kata pencarian dan slug kategori
 */
export const filterBySearchAndCategory = matchSearchAndCategory;

/**
 * Menghitung margin dalam persen dari harga jual dan HPP, dibulatkan.
 * @returns persen margin; 0 bila harga belum diisi
 */
export const marginPercent = ({ price, hpp }: Pick<MerchantMenu, "price" | "hpp">) =>
  price > 0 ? Math.round(((price - hpp) / price) * 100) : 0;
