import { describe, expect, it } from "vitest";
import { menus } from "./fixtures/menus";
import { reviews } from "./fixtures/reviews";
import { LIMIT_REVIEWS, summarizeByMenu, summarizeReviews, maskName, filterReviews } from "./review";

describe("samarkanNama (R-09)", () => {
  it("dua huruf pertama + ***", () => {
    expect(maskName("Rafli R.")).toBe("Ra***");
    expect(maskName("  budi ")).toBe("bu***");
    expect(maskName("Al")).toBe("Al***");
    expect(maskName("")).toBe("***");
  });
});

describe("ringkasUlasan (UL-N1)", () => {
  it("sebaran 5 sampai 1 berjumlah total; rata-rata 1 desimal", () => {
    const reviewList = reviews();
    const summary = summarizeReviews(reviewList);
    expect(summary.distribution.map((bucket) => bucket.stars)).toEqual([5, 4, 3, 2, 1]);
    expect(summary.distribution.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(reviewList.length);
    expect(summary.total).toBe(20);
    expect(summary.average).toBe(
      Math.round((reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length) * 10) / 10,
    );
  });
  it("kosong -> rata 0", () => {
    expect(summarizeReviews([])).toMatchObject({ total: 0, average: 0 });
  });
});

describe("ringkasPerMenu (UL-N2)", () => {
  it("menu tanpa ulasan tetap tampil dengan jumlah 0", () => {
    const reviewList = reviews();
    const result = summarizeByMenu(
      reviewList,
      menus().map((menu) => ({ id: menu.id, name: menu.name })),
    );
    expect(result.reduce((sum, menu) => sum + menu.count, 0)).toBe(reviewList.length);
    expect(result.length).toBe(menus().length);
  });
  it("menu yang hanya ada di ulasan tetap ikut", () => {
    const result = summarizeByMenu(reviews(), []);
    expect(result.reduce((sum, menu) => sum + menu.count, 0)).toBe(20);
  });
});

describe("saringUlasan (UL-N2, UL-N3)", () => {
  const reviewList = reviews();
  it("menyaring per menu dan bintang, terbaru dulu", () => {
    const id = reviewList[0].menu_id;
    const result = filterReviews(reviewList, { menu: id }, 1);
    expect(result.rows.every((review) => review.menu_id === id)).toBe(true);
    const byStars = filterReviews(reviewList, { stars: 5 }, 1);
    expect(byStars.rows.every((review) => review.rating === 5)).toBe(true);
    const createdTimes = byStars.rows.map((review) => Date.parse(review.created_at));
    expect([...createdTimes].sort((first, second) => second - first)).toEqual(createdTimes);
  });
  it("paginasi 10 per halaman", () => {
    expect(LIMIT_REVIEWS).toBe(10);
    const page1 = filterReviews(reviewList, {}, 1);
    const page2 = filterReviews(reviewList, {}, 2);
    expect(page1.total).toBe(20);
    expect(page1.rows).toHaveLength(10);
    expect(page2.rows).toHaveLength(10);
    expect(new Set([...page1.rows, ...page2.rows].map((review) => review.id)).size).toBe(20);
  });
});
