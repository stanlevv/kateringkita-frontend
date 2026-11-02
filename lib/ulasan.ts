import type { Review } from "./types";
import { urlDengan } from "./url";

export const LIMIT_ULASAN = 10;

/** R-09: "Rafli R." -> "Ra***". */
export function samarkanNama(nama: string): string {
  return `${nama.trim().slice(0, 2)}***`;
}

const satuDesimal = (n: number) => Math.round(n * 10) / 10;
const rata = (rs: Review[]) => (rs.length ? satuDesimal(rs.reduce((a, r) => a + r.rating, 0) / rs.length) : 0);

/** UL-N1 */
export function ringkasUlasan(rs: Review[]) {
  return {
    total: rs.length,
    rata: rata(rs),
    sebaran: [5, 4, 3, 2, 1].map((bintang) => ({ bintang, jumlah: rs.filter((r) => r.rating === bintang).length })),
  };
}

/** UL-N2: semua menu toko, ditambah menu yang hanya muncul di ulasan. */
export function ringkasPerMenu(rs: Review[], menus: { id: number; name: string }[]) {
  const daftar = new Map(menus.map((m) => [m.id, m.name]));
  for (const r of rs) if (!daftar.has(r.menu_id)) daftar.set(r.menu_id, r.menu_name);
  return [...daftar].map(([id, name]) => {
    const milik = rs.filter((r) => r.menu_id === id);
    return { menu_id: id, menu_name: name, rata: rata(milik), jumlah: milik.length };
  }).sort((a, b) => a.menu_name.localeCompare(b.menu_name, "id"));
}

/** UL-N2, UL-N3: terbaru dulu. */
export function saringUlasan(rs: Review[], f: { menu?: number; bintang?: number }, page: number) {
  const hasil = rs
    .filter((r) => (f.menu === undefined || r.menu_id === f.menu) && (f.bintang === undefined || r.rating === f.bintang))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return { total: hasil.length, rows: hasil.slice((page - 1) * LIMIT_ULASAN, page * LIMIT_ULASAN) };
}

export function urlUlasan(f: { menu?: number; bintang?: number; page?: number }): string {
  return urlDengan("/ulasan", "", { menu: f.menu?.toString(), bintang: f.bintang?.toString(), page: f.page && f.page > 1 ? String(f.page) : null });
}
