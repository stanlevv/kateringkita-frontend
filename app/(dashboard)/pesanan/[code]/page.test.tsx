import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/authService", () => ({ requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: null }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/orders", () => ({ orderAction: vi.fn() }));
vi.mock("@/services/orderService", async () => {
  const { orders } = await import("@/lib/fixtures/orders");
  return {
    getOrder: async (code: string) => {
      const o = orders().find((x) => x.code === code);
      return o ? { data: o } : { error: { code: "NOT_FOUND", message: "x" } };
    },
  };
});
import Halaman from "./page";

describe("PS-E1 / PS-N2 halaman detail", () => {
  it("kode tidak ada: blok 'Pesanan tidak ditemukan' + kembali", async () => {
    render(await Halaman({ params: Promise.resolve({ code: "KK-NOPE" }) }));
    expect(screen.getAllByText("Pesanan tidak ditemukan").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Kembali ke daftar pesanan" })).toHaveAttribute("href", "/pesanan");
  });
  it("?wa=gagal menampilkan banner singkat; tanpa flag tidak ada", async () => {
    const { unmount } = render(await Halaman({ params: Promise.resolve({ code: "KK-20261031-7QF2" }), searchParams: Promise.resolve({ wa: "gagal" }) }));
    expect(screen.getByText("WhatsApp belum bisa dibuka. Coba lagi.")).toBeInTheDocument();
    unmount();
    render(await Halaman({ params: Promise.resolve({ code: "KK-20261031-7QF2" }), searchParams: Promise.resolve({}) }));
    expect(screen.queryByText("WhatsApp belum bisa dibuka. Coba lagi.")).toBeNull();
  });
  it("kode ada: satu h1 dan rincian", async () => {
    render(await Halaman({ params: Promise.resolve({ code: "KK-20261031-7QF2" }) }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali ke daftar pesanan/ })).toHaveAttribute("href", "/pesanan");
  });
});
