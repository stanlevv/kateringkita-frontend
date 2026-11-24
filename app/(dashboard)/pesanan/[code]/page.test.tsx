// Test halaman /pesanan/[code]: kode tidak ada, banner ?wa=gagal, dan satu judul h1 dengan rincian.
// Services dipalsukan dengan fixture (vi.mock).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth.service", () => ({
  requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: null }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/orders", () => ({ orderAction: vi.fn() }));
vi.mock("@/services/order.service", async () => {
  const { orders } = await import("@/lib/fixtures/orders");
  return {
    getOrder: async (code: string) => {
      const order = orders().find((candidate) => candidate.code === code);
      return order ? { data: order } : { error: { code: "NOT_FOUND", message: "x" } };
    },
  };
});
import OrderDetailPage from "./page";

describe("halaman detail", () => {
  it("kode tidak ada: blok 'Pesanan tidak ditemukan' + kembali", async () => {
    render(await OrderDetailPage({ params: Promise.resolve({ code: "KK-NOPE" }) }));
    expect(screen.getAllByText("Pesanan tidak ditemukan").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Kembali ke daftar pesanan" })).toHaveAttribute("href", "/pesanan");
  });
  it("?wa=gagal menampilkan banner singkat; tanpa flag tidak ada", async () => {
    const { unmount } = render(
      await OrderDetailPage({
        params: Promise.resolve({ code: "KK-20261031-7QF2" }),
        searchParams: Promise.resolve({ wa: "gagal" }),
      }),
    );
    expect(screen.getByText("WhatsApp belum bisa dibuka. Coba lagi.")).toBeInTheDocument();
    unmount();
    render(
      await OrderDetailPage({
        params: Promise.resolve({ code: "KK-20261031-7QF2" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.queryByText("WhatsApp belum bisa dibuka. Coba lagi.")).toBeNull();
  });
  it("kode ada: satu h1 dan rincian", async () => {
    render(await OrderDetailPage({ params: Promise.resolve({ code: "KK-20261031-7QF2" }) }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali ke daftar pesanan/ })).toHaveAttribute("href", "/pesanan");
  });
});
