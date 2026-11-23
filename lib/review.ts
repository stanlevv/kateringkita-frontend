// Ringkasan dan penyaring ulasan untuk halaman Ulasan penjual.

import type { Review } from "@/types/review";
import { buildUrl } from "./url";

/** Jumlah ulasan per halaman. */
export const LIMIT_REVIEWS = 10;

/**
 * Menyamarkan nama pembeli untuk privasi, mis. "Rafli R." menjadi "Ra***".
 * @param name nama asli
 * @returns nama tersamar
 */
export function maskName(name: string): string {
  return `${name.trim().slice(0, 2)}***`;
}

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;
const average = (reviews: Review[]) =>
  reviews.length ? roundToOneDecimal(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) : 0;

/**
 * Meringkas ulasan: jumlah, rata-rata bintang (1 desimal), dan sebaran jumlah ulasan per bintang 5 sampai 1.
 * @param reviews semua ulasan
 * @returns `{ total, average, distribution }`
 */
export function summarizeReviews(reviews: Review[]) {
  return {
    total: reviews.length,
    average: average(reviews),
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((review) => review.rating === stars).length,
    })),
  };
}

/**
 * Meringkas ulasan per menu: semua menu toko ditambah menu yang hanya muncul di ulasan (mis. menu sudah dihapus), urut nama.
 * @param reviews semua ulasan
 * @param menus menu toko (id dan nama)
 * @returns satu baris per menu: id, nama, rata-rata, dan jumlah ulasan
 */
export function summarizeByMenu(reviews: Review[], menus: { id: number; name: string }[]) {
  const menuNames = new Map(menus.map((menu) => [menu.id, menu.name]));
  for (const review of reviews) if (!menuNames.has(review.menu_id)) menuNames.set(review.menu_id, review.menu_name);
  return [...menuNames]
    .map(([id, name]) => {
      const menuReviews = reviews.filter((review) => review.menu_id === id);
      return { menu_id: id, menu_name: name, average: average(menuReviews), count: menuReviews.length };
    })
    .sort((first, second) => first.menu_name.localeCompare(second.menu_name, "id"));
}

/**
 * Menyaring ulasan per menu dan/atau bintang, urut terbaru dulu, lalu mengambil satu halaman.
 * @param reviews semua ulasan
 * @param filter menu dan bintang yang dipilih (boleh kosong)
 * @param page nomor halaman, mulai 1
 * @returns `{ total, rows }`
 */
export function filterReviews(reviews: Review[], filter: { menu?: number; stars?: number }, page: number) {
  const matches = reviews
    .filter(
      (review) =>
        (filter.menu === undefined || review.menu_id === filter.menu) &&
        (filter.stars === undefined || review.rating === filter.stars),
    )
    .sort((first, second) => Date.parse(second.created_at) - Date.parse(first.created_at));
  return { total: matches.length, rows: matches.slice((page - 1) * LIMIT_REVIEWS, page * LIMIT_REVIEWS) };
}

/**
 * Membuat alamat halaman Ulasan untuk penyaring tertentu (parameter URL tetap `menu`, `bintang`, `page`).
 * @param filter menu, bintang, dan halaman
 * @returns alamat, mis. "/ulasan?bintang=5"
 */
export function reviewsUrl(filter: { menu?: number; stars?: number; page?: number }): string {
  return buildUrl("/ulasan", "", {
    menu: filter.menu?.toString(),
    bintang: filter.stars?.toString(),
    page: filter.page && filter.page > 1 ? String(filter.page) : null,
  });
}
