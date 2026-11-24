// Test halaman /toko: daftar toko, kosong, galat, dan metadata.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getPublicMerchants = vi.fn();
vi.mock("@/services/catalog.service", () => ({ getPublicMerchants: () => getPublicMerchants() }));

import Page, { metadata } from "./page";

const m = (slug: string, name: string, extra = {}) => ({
  slug,
  business_name: name,
  logo_url: null,
  merchant_type: { id: 1, name: "Katering" },
  rating_avg: 0,
  rating_count: 0,
  ...extra,
});

beforeEach(() => getPublicMerchants.mockReset());

describe("/toko", () => {
  it("menampilkan tautan tiap toko dengan nama dan jenis usaha", async () => {
    getPublicMerchants.mockResolvedValue({
      data: [m("dapur-ani", "Dapur Ani", { rating_avg: 4.5, rating_count: 3 }), m("warung-budi", "Warung Budi")],
    });
    render(await Page());
    expect(screen.getByRole("heading", { level: 1, name: "Katering kampus di KateringKita" })).toBeInTheDocument();
    const a = screen.getByRole("link", { name: /Dapur Ani/ });
    expect(a).toHaveAttribute("href", "/toko/dapur-ani");
    expect(a).toHaveTextContent("Katering");
    expect(a).toHaveTextContent("4.5");
    expect(screen.getByRole("link", { name: /Warung Budi/ })).toHaveAttribute("href", "/toko/warung-budi");
    expect(screen.getByRole("link", { name: /Warung Budi/ })).not.toHaveTextContent("0");
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
    expect(metadata.title).toBe("Daftar Katering Kampus");
    expect(metadata.alternates?.canonical).toBe("/toko");
  });
});
