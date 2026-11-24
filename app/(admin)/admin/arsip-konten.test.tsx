// Test filter Aktif/Arsip di halaman /admin/popup, /admin/banner, dan /admin/promo (F33): parameter ?arsip=1 meminta
// daftar arsip ke backend (?archived=true), dan pil filter menandai tampilan yang sedang dibuka.
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/admin/popup", () => ({ savePopup: vi.fn(), setPopupArchived: vi.fn() }));
vi.mock("@/app/actions/admin/banner", () => ({}));
vi.mock("@/app/actions/admin/promos", () => ({
  savePlatformPromo: vi.fn(),
  setPlatformPromoActive: vi.fn(),
  setPlatformPromoArchived: vi.fn(),
}));
vi.mock("@/app/actions/promos", () => ({}));
import BannerAdminPage from "./banner/page";
import PopupPage from "./popup/page";
import PromoPlatformPage from "./promo/page";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ user: { admin_level: "ops" } });
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: [] });
});

describe("filter Aktif / Arsip", () => {
  it("tanpa parameter: daftar biasa, pil Aktif terpilih", async () => {
    render(await PopupPage({ searchParams: Promise.resolve({}) }));
    expect(adminFetch).toHaveBeenCalledWith("/popups");
    expect(screen.getByRole("link", { name: "Aktif" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Arsip" })).toHaveAttribute("href", "/admin/popup?arsip=1");
  });

  it("?arsip=1: ketiga halaman meminta daftar arsip, pil Arsip terpilih", async () => {
    const archived = { searchParams: Promise.resolve({ arsip: "1" }) };
    render(await PopupPage(archived));
    expect(adminFetch).toHaveBeenCalledWith("/popups?archived=true");
    expect(screen.getByRole("link", { name: "Arsip" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Aktif" })).toHaveAttribute("href", "/admin/popup");
    render(await BannerAdminPage({ searchParams: Promise.resolve({ arsip: "1" }) }));
    expect(adminFetch).toHaveBeenCalledWith("/banners?archived=true");
    render(await PromoPlatformPage({ searchParams: Promise.resolve({ arsip: "1" }) }));
    expect(adminFetch).toHaveBeenCalledWith("/promos?archived=true");
    // Pilihan voucher pop-up dan banner tetap dari promo yang tidak diarsipkan.
    expect(adminFetch).toHaveBeenCalledWith("/promos");
  });
});
