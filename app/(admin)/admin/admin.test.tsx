// Test shell admin (requireAdmin, menu per tingkat admin, lencana antrean dari /queues, layar ganti sandi sementara),
// halaman Dashboard /admin (ringkasan dan ubin "Perlu tindakan"), dan halaman /admin/log (filter URL diteruskan ke
// backend).
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
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

const summary = {
  orders_today: { holding: 0, confirmed: 0, cooking: 0, ready: 0, completed: 1, cancelled: 0, expired: 0 },
  revenue_today: 0,
  merchants: { pending: 1, needs_fix: 0, verified: 0, suspended: 0, open_now: 0 },
  holding_expiring_soon: 0,
  recent_logs: [],
};
const queues = {
  merchants_pending: 2,
  tickets_open: 3,
  chats_reported: 1,
  payouts_pending: 4,
  refunds_pending: 2,
  ai_results_pending: 0,
};
const failed = { ok: false, status: 500, error: { code: "X", message: "x" } };

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({
    user: { full_name: "Dina", admin_level: "super", must_change_password: false },
    merchant: null,
  });
  // Layout memanggil /queues; bawaannya gagal (tanpa lencana).
  adminFetch.mockReset().mockResolvedValue(failed);
});

describe("shell admin", () => {
  it("layout memanggil requireAdmin; nav admin lengkap; tanpa banner Data contoh dan tanpa status dapur", async () => {
    render(await AdminLayout({ children: <p>isi</p> }));
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    const nav = screen.getAllByRole("navigation", { name: "Menu utama" })[0];
    const links = within(nav)
      .getAllByRole("link")
      .map((link) => [link.textContent, link.getAttribute("href")]);
    expect(links).toEqual([
      ["Dashboard", "/admin"],
      ["Verifikasi", "/admin/verifikasi"],
      ["Penjual", "/admin/penjual"],
      ["Pembeli", "/admin/pembeli"],
      ["Tiket", "/admin/tiket"],
      ["Chat dilaporkan", "/admin/chat-dilaporkan"],
      ["Moderasi", "/admin/moderasi"],
      ["Verifikasi AI", "/admin/hasil-ai"],
      ["Banner", "/admin/banner"],
      ["Pop-up", "/admin/popup"],
      ["Pengumuman", "/admin/pengumuman"],
      ["Promo & biaya", "/admin/promo"],
      ["Data master", "/admin/data-master"],
      ["Keuangan", "/admin/keuangan"],
      ["Pencairan", "/admin/pencairan"],
      ["AI", "/admin/ai"],
      ["Kelola admin", "/admin/admin"],
      ["Log", "/admin/log"],
      ["Server", "/admin/server"],
    ]);
    expect(within(nav).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText(/Data contoh/)).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText(/Pengaturan akun/)).toBeNull();
    expect(screen.getByText("isi")).toBeInTheDocument();
  });

  it("tingkat ops: menu khusus super (keuangan, AI, kelola admin, server) disembunyikan", async () => {
    requireAdmin.mockResolvedValue({
      user: { full_name: "Ops", admin_level: "ops", must_change_password: false },
      merchant: null,
    });
    render(await AdminLayout({ children: <p>isi</p> }));
    const nav = screen.getAllByRole("navigation", { name: "Menu utama" })[0];
    const href = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(href).toContain("/admin/moderasi");
    expect(href).toContain("/admin/tiket");
    for (const path of ["/admin/keuangan", "/admin/pencairan", "/admin/ai", "/admin/admin", "/admin/server"])
      expect(href).not.toContain(path);
  });

  it("tingkat support: menu Tiket ada (pekerjaan utama support); menu khusus super tetap disembunyikan", async () => {
    requireAdmin.mockResolvedValue({
      user: { full_name: "Sari", admin_level: "support", must_change_password: false },
      merchant: null,
    });
    render(await AdminLayout({ children: <p>isi</p> }));
    const nav = screen.getAllByRole("navigation", { name: "Menu utama" })[0];
    expect(within(nav).getByRole("link", { name: "Tiket" })).toHaveAttribute("href", "/admin/tiket");
    const href = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    for (const path of ["/admin/keuangan", "/admin/pencairan", "/admin/ai", "/admin/admin", "/admin/server"])
      expect(href).not.toContain(path);
  });

  it("lencana dari /queues di menu", async () => {
    adminFetch.mockImplementation(async (path: string) =>
      path === "/queues" ? { ok: true, status: 200, data: queues } : failed,
    );
    render(await AdminLayout({ children: <p>isi</p> }));
    expect(adminFetch).toHaveBeenCalledWith("/queues");
    const nav = screen.getAllByRole("navigation", { name: "Menu utama" })[0];
    expect(within(nav).getByRole("link", { name: /2 penjual menunggu verifikasi/ })).toHaveAttribute(
      "href",
      "/admin/verifikasi",
    );
  });

  it("sandi sementara: /queues tidak dipanggil dan menu tanpa lencana", async () => {
    requireAdmin.mockResolvedValue({
      user: { full_name: "Baru", admin_level: "ops", must_change_password: true },
      merchant: null,
    });
    render(await AdminLayout({ children: <p>isi</p> }));
    expect(adminFetch).not.toHaveBeenCalledWith("/queues");
    expect(screen.queryByText(/menunggu verifikasi/)).toBeNull();
  });

  it("/queues gagal: layout tetap tampil tanpa lencana", async () => {
    render(await AdminLayout({ children: <p>isi</p> }));
    expect(screen.getByText("isi")).toBeInTheDocument();
    expect(screen.queryByText(/menunggu verifikasi/)).toBeNull();
  });

  it("sandi sementara: isi halaman diganti formulir ganti sandi", async () => {
    requireAdmin.mockResolvedValue({
      user: { full_name: "Baru", admin_level: "ops", must_change_password: true },
      merchant: null,
    });
    render(await AdminLayout({ children: <p>isi</p> }));
    expect(screen.queryByText("isi")).toBeNull();
    expect(screen.getByRole("heading", { name: "Ganti kata sandi sementara" })).toBeInTheDocument();
  });
});

describe("halaman dashboard", () => {
  /** Membalas /summary dan /queues dengan data yang diberikan (undefined = gagal). */
  const respond = (summaryData: unknown, queuesData: unknown) =>
    adminFetch.mockImplementation(async (path: string) => {
      const data = path === "/summary" ? summaryData : path === "/queues" ? queuesData : undefined;
      return data ? { ok: true, status: 200, data } : failed;
    });
  const tiles = () => within(screen.getByRole("region", { name: "Perlu tindakan" }));

  it("memanggil requireAdmin sendiri, berjudul Dashboard, dan merender kartu", async () => {
    respond(summary, queues);
    render(await AdminPage());
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith("/summary");
    expect(adminFetch).toHaveBeenCalledWith("/queues");
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Menunggu verifikasi/ })).toHaveAttribute("href", "/admin/verifikasi");
  });
  it("Perlu tindakan (super): 5 ubin bertaut ke antreannya; ubin bernilai 0 tetap tampil", async () => {
    respond(summary, queues);
    render(await AdminPage());
    const links = tiles().getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin/verifikasi",
      "/admin/tiket?status=open",
      "/admin/chat-dilaporkan",
      "/admin/pencairan",
      "/admin/hasil-ai?status=menunggu",
    ]);
    expect(tiles().getByRole("link", { name: /Verifikasi penjual/ })).toHaveTextContent("2");
    expect(tiles().getByRole("link", { name: /Tiket menunggu balasan/ })).toHaveTextContent("3");
    expect(tiles().getByRole("link", { name: /Laporan chat belum dibuka/ })).toHaveTextContent("1");
    const payouts = tiles().getByRole("link", { name: /Pencairan/ });
    expect(payouts).toHaveTextContent("6");
    expect(payouts).toHaveTextContent("4 toko siap dicairkan · 2 refund menunggu");
    expect(tiles().getByRole("link", { name: /Hasil AI menunggu/ })).toHaveTextContent("0");
  });
  it("angka uang null (bukan super): 4 ubin tanpa Pencairan", async () => {
    respond(summary, { ...queues, payouts_pending: null, refunds_pending: null });
    render(await AdminPage());
    const hrefs = tiles()
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toHaveLength(4);
    expect(hrefs).not.toContain("/admin/pencairan");
  });
  it("/queues gagal: pesan antrean, ringkasan tetap tampil", async () => {
    respond(summary, undefined);
    render(await AdminPage());
    expect(tiles().getByText("Antrean belum bisa dimuat.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Menunggu verifikasi/ })).toBeInTheDocument();
  });
  it("gagal memuat ringkasan: pesan + Coba lagi", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    render(await AdminPage());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});

describe("halaman log", () => {
  const logRow = {
    id: 1,
    admin_user_id: 1,
    admin_name: "Dina",
    action: "promo.update",
    target_type: "promo",
    target_id: "3",
    reason: null,
    before: { value: 1 },
    after: { value: 2 },
    created_at: "2026-10-31T03:00:00.000Z",
  };
  it("requireAdmin + filter URL diteruskan ke backend + berisi", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [logRow], meta: { page: 2, limit: 20, total: 21 } });
    render(
      await LogPage({
        searchParams: Promise.resolve({
          action: "promo.update",
          target_type: "promo",
          from: "2026-10-01",
          to: "2026-10-31",
          page: "2",
          sampah: "x",
        }),
      }),
    );
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith(
      "/audit-logs?action=promo.update&target_type=promo&from=2026-10-01&to=2026-10-31&page=2&limit=20",
    );
    expect(screen.getByRole("cell", { name: "Ubah promo" })).toBeInTheDocument();
    expect(screen.getByText("Nilai: 1 → 2")).toBeInTheDocument();
  });
  it("page tidak valid atau terlalu besar menjadi 1", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [], meta: { page: 1, limit: 20, total: 0 } });
    for (const pageParam of ["abc", "99999999999", "-3", "1.5", "0"]) {
      render(await LogPage({ searchParams: Promise.resolve({ page: pageParam }) }));
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
