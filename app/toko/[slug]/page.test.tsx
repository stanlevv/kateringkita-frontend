// Test halaman /toko/[slug]: isi toko, metadata, validasi slug, galat, dan tombol aplikasi.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { MenuCard, MerchantProfile } from "@/types/catalog";

const getMerchantBySlug = vi.fn();
const getMerchantMenus = vi.fn();
vi.mock("@/services/catalog.service", () => ({
  getMerchantBySlug: (s: string) => getMerchantBySlug(s),
  getMerchantMenus: (s: string) => getMerchantMenus(s),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(f: T) => f }));

const env = vi.hoisted(() => ({ url: null as string | null }));
vi.mock("@/lib/site", async (orig) => ({
  ...(await orig<typeof import("@/lib/site")>()),
  get BUYER_APP_URL() {
    return env.url;
  },
}));

import Page, { generateMetadata } from "./page";

const profile: MerchantProfile = {
  id: 1,
  slug: "dapur-ani",
  business_name: "Dapur Ani",
  description: "Katering rumahan.",
  logo_url: null,
  cover_url: "https://r2.test/cover.jpg",
  merchant_type: { id: 1, name: "Katering" },
  is_open: true,
  open_time: "08:00",
  close_time: "17:00",
  rating_avg: 4.5,
  rating_count: 3,
  pickup_points: [{ id: 1, name: "Gerbang Utara", description: null }],
};
const menu = (id: number, name: string, price: number, badge: MenuCard["badge"] = "available"): MenuCard => ({
  id,
  name,
  price,
  image_url: null,
  unit_label: "porsi",
  category: { id: 1, name: "Nasi", slug: "nasi" },
  merchant: { id: 1, slug: "dapur-ani", business_name: "Dapur Ani", is_open: true },
  available: 5,
  badge,
  rating_avg: 0,
  rating_count: 0,
  is_favorite: false,
});
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  getMerchantBySlug.mockReset().mockResolvedValue({ data: profile });
  getMerchantMenus.mockReset().mockResolvedValue({ data: [menu(1, "Nasi Ayam", 15000), menu(2, "Nasi Telur", 12000, "sold_out")] });
  env.url = null;
});

describe("halaman toko", () => {
  it("menampilkan toko, menu, harga, titik temu, dan JSON-LD", async () => {
    const { container } = render(await Page(params("dapur-ani")));
    expect(screen.getByRole("heading", { level: 1, name: "Dapur Ani" })).toBeInTheDocument();
    expect(screen.getByText("Nasi Ayam")).toBeInTheDocument();
    expect(screen.getByText("Rp 15.000")).toBeInTheDocument();
    expect(screen.getByText("Gerbang Utara")).toBeInTheDocument();
    expect(screen.getByText("Habis")).toBeInTheDocument();
    expect(container.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  });

  it("tanpa menu dan tutup", async () => {
    getMerchantMenus.mockResolvedValue({ data: [] });
    getMerchantBySlug.mockResolvedValue({ data: { ...profile, is_open: false } });
    render(await Page(params("dapur-ani")));
    expect(screen.getByText("Toko ini belum memasang menu.")).toBeInTheDocument();
    expect(screen.getByText("Sedang tutup")).toBeInTheDocument();
  });

  it.each(["..%2Fadmin", "ABC", "a".repeat(161)])("slug tidak sah %s -> notFound tanpa panggil service", async (slug) => {
    await expect(Page(params(slug))).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(generateMetadata(params(slug))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getMerchantBySlug).not.toHaveBeenCalled();
  });

  it("NOT_FOUND -> notFound; galat lain dilempar", async () => {
    getMerchantBySlug.mockResolvedValue({ error: { code: "NOT_FOUND", message: "x" } });
    await expect(Page(params("dapur-ani"))).rejects.toThrow("NEXT_NOT_FOUND");
    getMerchantBySlug.mockResolvedValue({ error: { code: "INTERNAL", message: "boom" } });
    await expect(Page(params("dapur-ani"))).rejects.toThrow("boom");
  });

  it("tombol aplikasi hanya bila BUYER_APP_URL terisi", async () => {
    const { unmount } = render(await Page(params("dapur-ani")));
    expect(screen.queryByRole("link", { name: /Pesan lewat aplikasi/ })).toBeNull();
    unmount();
    env.url = "https://app.test";
    render(await Page(params("dapur-ani")));
    expect(screen.getByRole("link", { name: /Pesan lewat aplikasi/ })).toHaveAttribute("href", "https://app.test");
  });
});

describe("generateMetadata", () => {
  it("judul, kanonik, deskripsi dipotong, gambar OG", async () => {
    getMerchantBySlug.mockResolvedValue({ data: { ...profile, description: "x".repeat(300) } });
    const m = await generateMetadata(params("dapur-ani"));
    expect(m.title).toBe("Dapur Ani — Menu & Harga Katering");
    expect(m.alternates?.canonical).toBe("/toko/dapur-ani");
    expect((m.description ?? "").length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(m.openGraph)).toContain("https://r2.test/cover.jpg");
  });

  it("deskripsi null memakai teks bawaan", async () => {
    getMerchantBySlug.mockResolvedValue({ data: { ...profile, description: null } });
    const m = await generateMetadata(params("dapur-ani"));
    expect(m.description).toBe("Pesan katering dari Dapur Ani (Katering). Lihat menu, harga, dan titik ambil di KateringKita.");
  });
});
