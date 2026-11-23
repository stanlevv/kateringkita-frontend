import type { Review } from "@/types/review";
import { buildUrl } from "./url";

export const LIMIT_REVIEWS = 10;

/** R-09: "Rafli R." -> "Ra***". */
export function maskName(name: string): string {
  return `${name.trim().slice(0, 2)}***`;
}

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;
const average = (reviews: Review[]) =>
  reviews.length ? roundToOneDecimal(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) : 0;

/** UL-N1 */
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

/** UL-N2: semua menu toko, ditambah menu yang hanya muncul di ulasan. */
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

/** UL-N2, UL-N3: terbaru dulu. */
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

export function reviewsUrl(filter: { menu?: number; stars?: number; page?: number }): string {
  return buildUrl("/ulasan", "", {
    menu: filter.menu?.toString(),
    bintang: filter.stars?.toString(),
    page: filter.page && filter.page > 1 ? String(filter.page) : null,
  });
}
