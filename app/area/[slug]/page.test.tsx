// Test halaman /area/[slug]: validasi, redirect kanonik, isi, metadata, noindex, dan galat.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { MenuCard } from "@/types/catalog";

const getPickupPoints = vi.fn();
const getPublicMerchants = vi.fn();
const getMerchantMenus = vi.fn();
vi.mock("@/services/meta.service", () => ({ getPickupPoints: () => getPickupPoints() }));
vi.mock("@/services/catalog.service", () => ({
  getPublicMerchants: (id: number) => getPublicMerchants(id),
  getMerchantMenus: (s: string) => getMerchantMenus(s),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  permanentRedirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(f: T) => f }));

import Page, { generateMetadata } from "./page";

const SLUG = "3-gazebo-fakultas-ilmu-komputer";
const store = (slug: string, name: string, menu_count = 4) => ({
  slug,
  business_name: name,
  logo_url: null,
  merchant_type: { id: 1, name: "Katering" },
  rating_avg: 4.5,
  rating_count: 2,
  menu_count,
});
const menu = (id: number, name: string, is_open = true): MenuCard => ({
  id,
  name,
  price: 10000 + id,
  image_url: null,
  unit_label: "porsi",
  category: { id: 1, name: "Nasi", slug: "nasi" },
  merchant: { id: 1, slug: "x", business_name: "X", is_open },
  available: 5,
  badge: "available",
  rating_avg: 0,
  rating_count: 0,
  is_favorite: false,
});
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  getPickupPoints
    .mockReset()
    .mockResolvedValue({ data: [{ id: 3, name: "Gazebo Fakultas Ilmu Komputer", description: null }] });
  getPublicMerchants.mockReset().mockResolvedValue({ data: [store("ani", "Dapur Ani"), store("budi", "Dapur Budi")] });
  getMerchantMenus.mockReset().mockImplementation(async (s: string) => ({
    data: [1, 2, 3, 4].map((i) => menu(i, `Menu ${s} ${i}`, s !== "budi")),
  }));
});

describe("halaman area", () => {
  it("menampilkan toko, maksimal 3 menu, harga, label tutup, dan tautan kembali", async () => {
    render(await Page(params(SLUG)));
    expect(
      screen.getByRole("heading", { level: 1, name: "Katering di Gazebo Fakultas Ilmu Komputer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dapur Ani/ })).toHaveAttribute("href", "/toko/ani");
    expect(screen.getByRole("link", { name: /Dapur Budi/ })).toHaveAttribute("href", "/toko/budi");
    expect(screen.getByText("Menu ani 3")).toBeInTheDocument();
    expect(screen.queryByText("Menu ani 4")).toBeNull();
    expect(screen.getAllByText("Rp 10.001")).toHaveLength(2);
    expect(screen.getAllByText(/Sedang tutup/)).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Semua toko" })).toHaveAttribute("href", "/toko");
    expect(getPublicMerchants).toHaveBeenCalledWith(3);
  });

  it("id tidak sah -> notFound tanpa panggil service", async () => {
    await expect(Page(params("abc"))).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(generateMetadata(params("abc"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getPickupPoints).not.toHaveBeenCalled();
  });

  it("id tidak ada -> notFound", async () => {
    await expect(Page(params("9-lain"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it.each(["3-lama", "3"])("slug %s -> redirect permanen ke kanonik", async (s) => {
    await expect(Page(params(s))).rejects.toThrow(`REDIRECT:/area/${SLUG}`);
  });

  it("tanpa toko -> pesan kosong dan tautan ke /toko", async () => {
    getPublicMerchants.mockResolvedValue({ data: [] });
    render(await Page(params(SLUG)));
    expect(screen.getByText("Belum ada toko yang mengantar ke titik ini.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /toko/i }).some((l) => l.getAttribute("href") === "/toko")).toBe(true);
  });

  it("galat service dilempar", async () => {
    getPickupPoints.mockResolvedValue({ error: { code: "INTERNAL", message: "boom" } });
    await expect(Page(params(SLUG))).rejects.toThrow("boom");
    getPickupPoints.mockResolvedValue({ data: [{ id: 3, name: "Gazebo Fakultas Ilmu Komputer", description: null }] });
    getPublicMerchants.mockResolvedValue({ error: { code: "INTERNAL", message: "bang" } });
    await expect(Page(params(SLUG))).rejects.toThrow("bang");
    getPublicMerchants.mockResolvedValue({ data: [store("ani", "Dapur Ani")] });
    getMerchantMenus.mockResolvedValue({ error: { code: "INTERNAL", message: "menu" } });
    await expect(Page(params(SLUG))).rejects.toThrow("menu");
  });
});

describe("generateMetadata", () => {
  it("judul, kanonik, deskripsi, OG; 2 toko bermenu -> bisa diindeks", async () => {
    const m = await generateMetadata(params(SLUG));
    expect(m.title).toBe("Katering di Gazebo Fakultas Ilmu Komputer — Menu & Harga");
    expect(m.alternates?.canonical).toBe(`/area/${SLUG}`);
    expect(m.description).toBe(
      "2 toko katering mengantar ke Gazebo Fakultas Ilmu Komputer. Lihat menu, harga, dan pesan lewat KateringKita.",
    );
    expect(m.openGraph).toMatchObject({ type: "website", locale: "id_ID", url: `/area/${SLUG}` });
    expect(m.robots).toBeUndefined();
  });

  it.each([
    ["1 toko bermenu", [store("ani", "Dapur Ani"), store("budi", "Dapur Budi", 0)]],
    ["0 toko", []],
    ["semua menu_count 0", [store("ani", "A", 0), store("budi", "B", 0)]],
  ])("%s -> noindex", async (_n, data) => {
    getPublicMerchants.mockResolvedValue({ data });
    const m = await generateMetadata(params(SLUG));
    expect(m.robots).toEqual({ index: false, follow: true });
  });
});
