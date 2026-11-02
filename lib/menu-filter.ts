import { stokMenu } from "./dashboard";
import type { MerchantMenu } from "./types";

export type StatusMenu = "semua" | "aktif" | "menipis" | "habis" | "nonaktif";
export type FilterMenu = { q: string; kategori: string; status: StatusMenu };

export const STATUS_MENU: StatusMenu[] = ["semua", "aktif", "menipis", "habis", "nonaktif"];

// "Aktif" = semua menu aktif, jadi jumlahnya tumpang tindih dengan Menipis/Habis (mirip API.md status=active|low|sold_out|inactive).
const cocokStatus: Record<StatusMenu, (m: MerchantMenu) => boolean> = {
  semua: () => true,
  aktif: (m) => m.is_active,
  menipis: (m) => m.is_active && stokMenu(m) === "menipis",
  habis: (m) => m.is_active && stokMenu(m) === "habis",
  nonaktif: (m) => !m.is_active,
};

const tanpaStatus = (menus: MerchantMenu[], f: Pick<FilterMenu, "q" | "kategori">) => {
  const q = f.q.trim().toLowerCase();
  return menus.filter((m) => (!q || m.name.toLowerCase().includes(q)) && (!f.kategori || m.category.slug === f.kategori));
};

export const saring = (menus: MerchantMenu[], f: FilterMenu) => tanpaStatus(menus, f).filter(cocokStatus[f.status]);

/** Jumlah per tab, mengikuti pencarian dan kategori (bukan tab terpilih). */
export function hitungTab(menus: MerchantMenu[]): Record<StatusMenu, number> {
  return Object.fromEntries(STATUS_MENU.map((s) => [s, menus.filter(cocokStatus[s]).length])) as Record<StatusMenu, number>;
}

export const saringQK = tanpaStatus;

export const marginPersen = ({ price, hpp }: Pick<MerchantMenu, "price" | "hpp">) => (price > 0 ? Math.round(((price - hpp) / price) * 100) : 0);
