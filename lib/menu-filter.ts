import { menuStockLevel } from "./dashboard";
import type { MerchantMenu } from "@/types/menu";

export type MenuStatusFilter = "semua" | "aktif" | "menipis" | "habis" | "nonaktif";
export type MenuFilter = { q: string; category: string; status: MenuStatusFilter };

export const MENU_STATUS_FILTERS: MenuStatusFilter[] = ["semua", "aktif", "menipis", "habis", "nonaktif"];

// "Aktif" = semua menu aktif, jadi jumlahnya tumpang tindih dengan Menipis/Habis (mirip API.md status=active|low|sold_out|inactive).
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

export const filterMenus = (menus: MerchantMenu[], filter: MenuFilter) =>
  matchSearchAndCategory(menus, filter).filter(matchesStatus[filter.status]);

/** Jumlah per tab, mengikuti pencarian dan kategori (bukan tab terpilih). */
export function countMenuTabs(menus: MerchantMenu[]): Record<MenuStatusFilter, number> {
  return Object.fromEntries(
    MENU_STATUS_FILTERS.map((status) => [status, menus.filter(matchesStatus[status]).length]),
  ) as Record<MenuStatusFilter, number>;
}

export const filterBySearchAndCategory = matchSearchAndCategory;

export const marginPercent = ({ price, hpp }: Pick<MerchantMenu, "price" | "hpp">) =>
  price > 0 ? Math.round(((price - hpp) / price) * 100) : 0;
