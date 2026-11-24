// Test halaman /ulasan: ?bintang= menyaring daftar ulasan dan tetap ikut di tautan paginasi.
// Ulasan, menu, dan sesi penjual dipalsukan (vi.mock).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Review } from "@/types/review";

const makeReview = (id: number, rating: number): Review => ({
  id,
  menu_id: 1,
  menu_name: "Nasi Box",
  customer_name: "Rafli",
  rating,
  comment: rating === 5 ? "Enak" : "Buruk",
  created_at: `2026-11-${String(id).padStart(2, "0")}T03:00:00.000Z`,
});
// 12 ulasan bintang 5 (dua halaman) dan 3 ulasan bintang 1.
const allReviews = [
  ...Array.from({ length: 12 }, (_, i) => makeReview(i + 1, 5)),
  ...[13, 14, 15].map((id) => makeReview(id, 1)),
];

vi.mock("@/services/auth.service", () => ({ requireMerchant: async () => ({}) }));
vi.mock("@/services/review.service", () => ({ getReviews: async () => ({ data: allReviews }) }));
vi.mock("@/services/menu.service", () => ({ getMenus: async () => ({ data: [] }) }));
import ReviewsPage from "./page";

describe("halaman /ulasan", () => {
  it("?bintang=5 menyaring daftar dan tautan halaman berikutnya tetap membawa bintang", async () => {
    render(await ReviewsPage({ searchParams: Promise.resolve({ bintang: "5" }) }));
    expect(screen.getAllByText("Enak")).toHaveLength(10);
    expect(screen.queryByText("Buruk")).toBeNull();
    expect(screen.getByRole("link", { name: "5 bintang" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Berikutnya" })).toHaveAttribute("href", "/ulasan?bintang=5&page=2");
  });
});
