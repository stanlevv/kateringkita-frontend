import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { menus } from "@/lib/fixtures/menus";
import { reviews } from "@/lib/fixtures/reviews";
import { summarizeReviews, filterReviews } from "@/lib/review";
import { MenuRatings, RatingSummary } from "./RatingSummary";
import { ReviewList } from "./ReviewList";

const allReviews = reviews();
const menuOptions = menus().map((menu) => ({ id: menu.id, name: menu.name }));

describe("RatingSummary (UL-N1)", () => {
  it("rata-rata, jumlah, dan sebaran 5->1 berjumlah total (teks, bukan warna saja)", () => {
    render(<RatingSummary reviews={allReviews} />);
    const summary = summarizeReviews(allReviews);
    expect(screen.getByText(summary.average.toLocaleString("id-ID", { minimumFractionDigits: 1 }))).toBeInTheDocument();
    expect(screen.getByText("dari 20 ulasan")).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    const counts = rows.map((row) => Number(within(row).getByTestId("jumlah").textContent));
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(20);
    expect(within(rows[0]).getByText("5 bintang")).toBeInTheDocument();
  });
});

describe("MenuRatings (UL-N2)", () => {
  it("tiap menu tautan ke ?menu=<id>; Semua menu mengosongkan filter", () => {
    render(<MenuRatings reviews={allReviews} menus={menuOptions} menuId={allReviews[0].menu_id} />);
    const link = screen.getByRole("link", { name: new RegExp(allReviews[0].menu_name) });
    expect(link).toHaveAttribute("href", `/ulasan?menu=${allReviews[0].menu_id}`);
    expect(link).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Semua menu" })).toHaveAttribute("href", "/ulasan");
  });
});

describe("ReviewList (UL-N3, UL-S1)", () => {
  it("nama disamarkan, bintang dengan teks pembaca layar, menu, tanggal", () => {
    const { rows, total } = filterReviews(allReviews, {}, 1);
    render(<ReviewList rows={rows} total={total} page={1} filter={{}} />);
    expect(screen.getAllByText(/^[A-Za-z]{2}\*\*\*$/)).toHaveLength(10);
    expect(screen.queryByText(/Rafli R\./)).toBeNull();
    expect(screen.getAllByText(/dari 5 bintang/).length).toBe(10);
    expect(screen.getByRole("link", { name: "Berikutnya" })).toHaveAttribute("href", "/ulasan?page=2");
  });
  it("filter bintang berupa tautan yang mempertahankan menu", () => {
    const { rows, total } = filterReviews(allReviews, { menu: 3 }, 1);
    render(<ReviewList rows={rows} total={total} page={1} filter={{ menu: 3 }} />);
    expect(screen.getByRole("link", { name: /^4 bintang/ })).toHaveAttribute("href", "/ulasan?menu=3&bintang=4");
    expect(screen.getByRole("link", { name: "Semua bintang" })).toHaveAttribute("aria-current", "true");
  });
  it("UL-S1 belum ada ulasan sama sekali", () => {
    render(<ReviewList rows={[]} total={0} page={1} filter={{}} noReviews />);
    expect(screen.getByText("Ulasan muncul setelah pembeli menyelesaikan pesanan")).toBeInTheDocument();
  });
  it("tersaring tapi kosong -> tautan hapus filter", () => {
    render(<ReviewList rows={[]} total={0} page={1} filter={{ stars: 1 }} />);
    expect(screen.getByRole("link", { name: "Hapus filter" })).toHaveAttribute("href", "/ulasan");
  });
});
