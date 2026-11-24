// Test halaman /toko: daftar toko, kosong, galat, dan metadata.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getPublicMerchants = vi.fn();
vi.mock("next/server", () => ({ connection: async () => {} }));
const getPickupPoints = vi.fn();
vi.mock("@/services/meta.service", () => ({ getPickupPoints: () => getPickupPoints() }));
vi.mock("@/services/catalog.service", () => ({ getPublicMerchants: () => getPublicMerchants() }));

import Page, { metadata } from "./page";

const m = (slug: string, name: string, extra = {}) => ({
  slug,
  business_name: name,
  logo_url: null,
  merchant_type: { id: 1, name: "Katering" },
  rating_avg: 0,
  rating_count: 0,
  menu_count: 0,
  ...extra,
});

beforeEach(() => {
  getPublicMerchants.mockReset();
  getPickupPoints.mockReset().mockResolvedValue({ data: [] });
});

describe("/toko", () => {
  it("menampilkan tautan tiap toko dengan nama dan jenis usaha", async () => {
    getPublicMerchants.mockResolvedValue({
      data: [m("dapur-ani", "Dapur Ani", { rating_avg: 4.33, rating_count: 3 }), m("warung-budi", "Warung Budi")],
    });
    render(await Page());
    expect(screen.getByRole("heading", { level: 1, name: "Katering di sekitar kampus UB Malang" })).toBeInTheDocument();
    const a = screen.getByRole("link", { name: /Dapur Ani/ });
    expect(a).toHaveAttribute("href", "/toko/dapur-ani");
    expect(a).toHaveTextContent("Katering");
    expect(a).toHaveTextContent("4.3 (3 ulasan)");
    expect(screen.getByRole("link", { name: /Warung Budi/ })).toHaveAttribute("href", "/toko/warung-budi");
    expect(screen.getByRole("link", { name: /Warung Budi/ })).not.toHaveTextContent("ulasan");
  });

  it("menampilkan tautan ke tiap titik ambil", async () => {
    getPublicMerchants.mockResolvedValue({ data: [] });
    getPickupPoints.mockResolvedValue({
      data: [
        { id: 3, name: "Gazebo Fakultas Ilmu Komputer" },
        { id: 4, name: "Gerbang Utara" },
      ],
    });
    render(await Page());
    expect(screen.getByRole("heading", { level: 2, name: "Cari berdasarkan titik ambil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gazebo Fakultas Ilmu Komputer" })).toHaveAttribute(
      "href",
      "/area/3-gazebo-fakultas-ilmu-komputer",
    );
    expect(screen.getByRole("link", { name: "Gerbang Utara" })).toHaveAttribute("href", "/area/4-gerbang-utara");
  });

  it.each([
    ["error", () => getPickupPoints.mockResolvedValue({ error: { code: "X", message: "x" } })],
    ["throw", () => getPickupPoints.mockRejectedValue(new Error("down"))],
    ["kosong", () => getPickupPoints.mockResolvedValue({ data: [] })],
  ])("titik ambil %s: bagian disembunyikan, halaman tetap tampil", async (_n, setup) => {
    getPublicMerchants.mockResolvedValue({ data: [m("a", "Dapur Ani")] });
    setup();
    render(await Page());
    expect(screen.queryByText("Cari berdasarkan titik ambil")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dapur Ani/ })).toBeInTheDocument();
  });

  it("ada tautan kembali ke beranda", async () => {
    getPublicMerchants.mockResolvedValue({ data: [] });
    render(await Page());
    expect(screen.getByRole("link", { name: "KateringKita, beranda" })).toHaveAttribute("href", "/");
  });

  it("daftar kosong", async () => {
    getPublicMerchants.mockResolvedValue({ data: [] });
    render(await Page());
    expect(screen.getByText("Belum ada toko yang bisa dipesan.")).toBeInTheDocument();
  });

  it("galat service dilempar", async () => {
    getPublicMerchants.mockResolvedValue({ error: { code: "X", message: "gagal" } });
    await expect(Page()).rejects.toThrow("gagal");
  });

  it("metadata", () => {
    expect(metadata.title).toBe("Katering Kampus UB Malang");
    expect(metadata.description).toContain("Universitas Brawijaya, Malang");
    expect(metadata.description!.length).toBeLessThanOrEqual(160);
    expect(metadata.alternates?.canonical).toBe("/toko");
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "id_ID",
      title: "Katering Kampus UB Malang",
      images: ["/opengraph-image"],
      url: "/toko",
    });
    expect(metadata.openGraph?.description).toBe(metadata.description);
  });
});
