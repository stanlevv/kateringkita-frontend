import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/server",
  useSearchParams: () => new URLSearchParams(),
}));
import ServerPage from "./page";
import { GrafikPerJam } from "./components/GrafikPerJam";

const jam = (n: number, e = 0, l = 0) => ({ jam: new Date(Date.UTC(2026, 10, 10, n)).toISOString(), error: e, lambat: l });
const perJam = Array.from({ length: 24 }, (_, i) => jam(i, i === 3 ? 2 : 0, i === 3 ? 1 : i === 10 ? 4 : 0));
const status = {
  uptime_s: 90_061, memori_mb: 128, node: "v22.11.0",
  db: { ok: true, latency_ms: 42, migrasi_terakhir: "007_log_server.sql" },
  ringkas_24j: { error: 2, lambat: 5 }, per_jam: perJam,
};
const log = {
  id: 9, request_id: "rid-abc", level: "error", method: "POST", path: "/api/v1/orders", status: 502,
  duration_ms: 812, message: "UPSTREAM: Midtrans gagal", user_id: 3, created_at: "2026-11-10T03:00:00.000Z",
};
const balas = (s: unknown, l: unknown) => adminFetch.mockImplementation((p: string) => Promise.resolve(p === "/server-status" ? s : l));

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ user: { full_name: "Dina" }, merchant: null });
  adminFetch.mockReset();
});

describe("halaman server", () => {
  it("requireAdmin, filter URL tervalidasi diteruskan, KPI + log tampil", async () => {
    balas({ ok: true, status: 200, data: status }, { ok: true, status: 200, data: [log], meta: { page: 2, limit: 20, total: 21 } });
    render(await ServerPage({ searchParams: Promise.resolve({ level: "error", q: "rid-abc", page: "2", sampah: "x" }) }));
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith("/server-status");
    expect(adminFetch).toHaveBeenCalledWith("/server-logs?level=error&q=rid-abc&page=2&limit=20");
    expect(screen.getByText("1 hr 1 j 1 mnt")).toBeInTheDocument();
    expect(screen.getByText("42 ms")).toBeInTheDocument();
    expect(screen.getByText("Migrasi terakhir: 007_log_server.sql")).toBeInTheDocument();
    const baris = screen.getByRole("row", { name: /rid-abc/ });
    expect(within(baris).getByText("502")).toBeInTheDocument();
    expect(within(baris).getByText("UPSTREAM: Midtrans gagal")).toBeInTheDocument();
    expect(within(baris).getByText("Error")).toBeInTheDocument();
  });

  it("level asing dibuang; page tidak valid menjadi 1", async () => {
    balas({ ok: true, status: 200, data: status }, { ok: true, status: 200, data: [], meta: { page: 1, limit: 20, total: 0 } });
    render(await ServerPage({ searchParams: Promise.resolve({ level: "info", page: "-3" }) }));
    expect(adminFetch).toHaveBeenCalledWith("/server-logs?page=1&limit=20");
    expect(screen.getByText("Tidak ada log yang cocok.")).toBeInTheDocument();
  });

  it("status gagal tidak menyembunyikan log; log gagal punya Coba lagi", async () => {
    balas({ ok: false, status: 500, error: { code: "X", message: "x" } }, { ok: true, status: 200, data: [log], meta: { total: 1 } });
    render(await ServerPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Status server belum bisa dimuat")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /rid-abc/ })).toBeInTheDocument();
    balas({ ok: true, status: 200, data: status }, { ok: false, status: 0, error: { code: "NETWORK", message: "x" } });
    render(await ServerPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Log belum bisa dimuat")).toBeInTheDocument();
  });
});

describe("grafik per jam", () => {
  it("legenda berlabel + total, batang bisa difokus dengan tooltip, tabel 24 baris", () => {
    render(<GrafikPerJam data={perJam} />);
    const legenda = screen.getByRole("list", { name: "Legenda" });
    expect(within(legenda).getByText(/Error 5xx/)).toHaveTextContent("Error 5xx 2");
    expect(within(legenda).getByText(/Lambat/)).toHaveTextContent("Lambat > 2 dtk 5");
    const batang = screen.getAllByRole("button", { name: /WIB:/ });
    expect(batang).toHaveLength(24);
    fireEvent.focus(batang[3]);
    expect(screen.getByRole("status")).toHaveTextContent("10.00 WIB · 2 error · 1 lambat");
    fireEvent.blur(batang[3]);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getAllByRole("row")).toHaveLength(25);
  });

  it("24 jam bersih: pesan aman tanpa batang", () => {
    render(<GrafikPerJam data={Array.from({ length: 24 }, (_, i) => jam(i))} />);
    expect(screen.getByText(/Tidak ada error atau request lambat/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /WIB:/ })).toHaveLength(0);
  });
});
