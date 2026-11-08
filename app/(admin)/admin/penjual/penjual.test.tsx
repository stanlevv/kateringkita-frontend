import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/penjual",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/actions/admin/merchants", () => ({ aksiPenjual: vi.fn() }));
import VerifikasiPage from "../verifikasi/page";
import PenjualPage from "./page";
import DetailPage from "./[id]/page";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset();
});

describe("halaman verifikasi & penjual", () => {
  it("verifikasi: requireAdmin + antrean; gagal -> Coba lagi", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    render(await VerifikasiPage());
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith("/verification-queue");
    expect(screen.getByText("Tidak ada penjual yang menunggu verifikasi")).toBeInTheDocument();
    adminFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    render(await VerifikasiPage());
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
  it("daftar: requireAdmin + filter URL diteruskan + halaman dibatasi", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [], meta: { page: 1, limit: 20, total: 0 } });
    render(await PenjualPage({ searchParams: Promise.resolve({ q: "siti", status: "pending", open: "1", page: "abc", x: "y" }) }));
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith("/merchants?q=siti&status=pending&open=1&page=1&limit=20");
  });
  it("daftar: status dan open tak valid diabaikan; q dipangkas", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [], meta: { page: 1, limit: 20, total: 0 } });
    render(await PenjualPage({ searchParams: Promise.resolve({ status: "hacker", open: "2", q: "  " }) }));
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants?page=1&limit=20");
    render(await PenjualPage({ searchParams: Promise.resolve({ status: "needs_fix", open: "0" }) }));
    expect(adminFetch).toHaveBeenLastCalledWith("/merchants?status=needs_fix&open=0&page=1&limit=20");
  });
  it("tanpa admin (requireAdmin melempar): backend tidak dipanggil di semua halaman", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(VerifikasiPage()).rejects.toThrow();
    await expect(PenjualPage({ searchParams: Promise.resolve({}) })).rejects.toThrow();
    await expect(DetailPage({ params: Promise.resolve({ id: "1" }) })).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("detail: requireAdmin; id tidak valid atau 404 -> Penjual tidak ditemukan + tautan kembali", async () => {
    render(await DetailPage({ params: Promise.resolve({ id: "abc" }) }));
    expect(adminFetch).not.toHaveBeenCalled();
    expect(screen.getByText("Penjual tidak ditemukan")).toBeInTheDocument();
    adminFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "x" } });
    render(await DetailPage({ params: Promise.resolve({ id: "99" }) }));
    expect(requireAdmin).toHaveBeenCalledTimes(2);
    expect(adminFetch).toHaveBeenCalledWith("/merchants/99");
    expect(screen.getAllByRole("link", { name: "Kembali ke daftar penjual" })).toHaveLength(2);
  });
});
