import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
import AdminLayout from "./layout";
import AdminPage from "./page";
import LogPage from "./log/page";

const ringkasan = {
  orders_today: { holding: 0, confirmed: 0, cooking: 0, ready: 0, completed: 1, cancelled: 0, expired: 0 },
  revenue_today: 0,
  merchants: { pending: 1, needs_fix: 0, verified: 0, suspended: 0, open_now: 0 },
  holding_expiring_soon: 0,
  recent_logs: [],
};

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ user: { full_name: "Dina", admin_level: "super", must_change_password: false }, merchant: null });
  adminFetch.mockReset();
});

describe("shell admin", () => {
  it("layout memanggil requireAdmin; nav admin lengkap; tanpa banner Data contoh dan tanpa status dapur", async () => {
    render(await AdminLayout({ children: <p>isi</p> }));
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    const nav = screen.getAllByRole("navigation", { name: "Menu utama" })[0];
    const tautan = within(nav).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")]);
    expect(tautan).toEqual([
      ["Ringkasan", "/admin"],
      ["Verifikasi", "/admin/verifikasi"],
      ["Penjual", "/admin/penjual"],
      ["Moderasi", "/admin/moderasi"],
      ["Tiket", "/admin/tiket"],
      ["Data master", "/admin/data-master"],
      ["Promo & biaya", "/admin/promo"],
      ["Keuangan", "/admin/keuangan"],
      ["Pencairan", "/admin/pencairan"],
      ["Pengumuman", "/admin/pengumuman"],
      ["AI", "/admin/ai"],
      ["Kelola admin", "/admin/admin"],
      ["Log", "/admin/log"],
      ["Server", "/admin/server"],
    ]);
    expect(within(nav).getByRole("link", { name: "Ringkasan" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText(/Data contoh/)).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText(/Pengaturan akun/)).toBeNull();
    expect(screen.getByText("isi")).toBeInTheDocument();
  });

  it("tingkat ops: menu khusus super (keuangan, AI, kelola admin, server) disembunyikan", async () => {
    requireAdmin.mockResolvedValue({ user: { full_name: "Ops", admin_level: "ops", must_change_password: false }, merchant: null });
    render(await AdminLayout({ children: <p>isi</p> }));
    const nav = screen.getAllByRole("navigation", { name: "Menu utama" })[0];
    const href = within(nav).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(href).toContain("/admin/moderasi");
    expect(href).toContain("/admin/tiket");
    for (const h of ["/admin/keuangan", "/admin/pencairan", "/admin/ai", "/admin/admin", "/admin/server"]) expect(href).not.toContain(h);
  });

  it("tingkat support: menu Tiket ada (pekerjaan utama support); menu khusus super tetap disembunyikan", async () => {
    requireAdmin.mockResolvedValue({ user: { full_name: "Sari", admin_level: "support", must_change_password: false }, merchant: null });
    render(await AdminLayout({ children: <p>isi</p> }));
    const nav = screen.getAllByRole("navigation", { name: "Menu utama" })[0];
    expect(within(nav).getByRole("link", { name: "Tiket" })).toHaveAttribute("href", "/admin/tiket");
    const href = within(nav).getAllByRole("link").map((a) => a.getAttribute("href"));
    for (const h of ["/admin/keuangan", "/admin/pencairan", "/admin/ai", "/admin/admin", "/admin/server"]) expect(href).not.toContain(h);
  });

  it("sandi sementara: isi halaman diganti formulir ganti sandi", async () => {
    requireAdmin.mockResolvedValue({ user: { full_name: "Baru", admin_level: "ops", must_change_password: true }, merchant: null });
    render(await AdminLayout({ children: <p>isi</p> }));
    expect(screen.queryByText("isi")).toBeNull();
    expect(screen.getByRole("heading", { name: "Ganti kata sandi sementara" })).toBeInTheDocument();
  });
});

describe("halaman ringkasan", () => {
  it("memanggil requireAdmin sendiri dan merender kartu", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: ringkasan });
    render(await AdminPage());
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith("/summary");
    expect(screen.getByRole("link", { name: /Menunggu verifikasi/ })).toHaveAttribute("href", "/admin/verifikasi");
  });
  it("G-1 gagal: pesan + Coba lagi", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    render(await AdminPage());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});

describe("halaman log", () => {
  const baris = { id: 1, admin_user_id: 1, admin_name: "Dina", action: "promo.update", target_type: "promo", target_id: "3", reason: null, before: { value: 1 }, after: { value: 2 }, created_at: "2026-10-31T03:00:00.000Z" };
  it("requireAdmin + filter URL diteruskan ke backend + berisi", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [baris], meta: { page: 2, limit: 20, total: 21 } });
    render(await LogPage({ searchParams: Promise.resolve({ action: "promo.update", target_type: "promo", from: "2026-10-01", to: "2026-10-31", page: "2", sampah: "x" }) }));
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith("/audit-logs?action=promo.update&target_type=promo&from=2026-10-01&to=2026-10-31&page=2&limit=20");
    expect(screen.getByRole("cell", { name: "Ubah promo" })).toBeInTheDocument();
    expect(screen.getByText("Nilai: 1 → 2")).toBeInTheDocument();
  });
  it("page tidak valid atau terlalu besar menjadi 1", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [], meta: { page: 1, limit: 20, total: 0 } });
    for (const p of ["abc", "99999999999", "-3", "1.5", "0"]) {
      render(await LogPage({ searchParams: Promise.resolve({ page: p }) }));
      expect(adminFetch).toHaveBeenLastCalledWith("/audit-logs?page=1&limit=20");
    }
  });
  it("kosong dan gagal", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [], meta: { page: 1, limit: 20, total: 0 } });
    render(await LogPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Belum ada aksi admin")).toBeInTheDocument();
    adminFetch.mockResolvedValue({ ok: false, status: 0, error: { code: "NETWORK", message: "x" } });
    render(await LogPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});
