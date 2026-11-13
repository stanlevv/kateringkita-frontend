import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
const replace = vi.fn();
const push = vi.fn();
const url = vi.hoisted(() => ({ q: "" }));
vi.mock("@/services/authService", () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace, push }),
  usePathname: () => "/admin/tiket",
  useSearchParams: () => new URLSearchParams(url.q),
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));
vi.mock("@/app/actions/admin/tiket", () => ({ balasTiket: vi.fn(), tutupTiket: vi.fn() }));
import type { DetailTiket, TiketRingkas } from "@/types/admin";
import { TiketTable } from "./components/TiketTable";
import TiketPage from "./page";
import DetailPage from "./[code]/page";
import TiketTidakDitemukan from "./[code]/not-found";

const SEKARANG = Date.parse("2026-11-13T03:00:00.000Z");
const tiket = (o: Partial<TiketRingkas> = {}): TiketRingkas => ({
  code: "TK-20261113-7QPX", category: "pembayaran", subject: "VA sudah dibayar tapi status belum lunas", status: "open",
  order_code: "KK-20261113-DC4T", created_at: "2026-11-13T02:00:00.000Z", last_message_at: "2026-11-13T02:55:00.000Z",
  last_message_preview: "Sudah saya bayar jam 9 pagi", last_sender_role: "customer",
  customer: { id: 7, full_name: "Budi Santoso", phone: "081234567890" }, ...o,
});
const COUNTS = { open: 3, answered: 2, closed: 5 };
const balas = (data: TiketRingkas[], meta: object = {}) => ({ ok: true, status: 200, data, meta: { page: 1, limit: 20, total: data.length, counts: COUNTS, ...meta } });
const halaman = async (sp: Record<string, string | undefined> = {}) => render(await TiketPage({ searchParams: Promise.resolve(sp) }));

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue(balas([tiket()]));
  replace.mockReset();
  push.mockReset();
  url.q = "";
});
afterEach(() => vi.useRealTimers());

describe("/admin/tiket daftar", () => {
  it("bawaan tab Menunggu: requireAdmin semua tingkat, status=open ke backend, jumlah per tab dari meta.counts", async () => {
    await halaman();
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(adminFetch).toHaveBeenCalledWith("/tickets?status=open&page=1&limit=20");
    const tab = (n: RegExp) => screen.getByRole("tab", { name: n });
    expect(tab(/Menunggu/)).toHaveAttribute("aria-selected", "true");
    expect(tab(/Menunggu/)).toHaveTextContent("3");
    expect(tab(/Dibalas/)).toHaveTextContent("2");
    expect(tab(/Ditutup/)).toHaveTextContent("5");
    expect(tab(/Semua/)).toHaveTextContent("10");
    expect(screen.getByText("Yang paling lama menunggu ada di atas.")).toBeInTheDocument();
  });

  it("baris: kode menaut ke detail, judul, kategori, pembeli + telepon, kode pesanan, waktu relatif, pengirim terakhir", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(SEKARANG);
    await halaman();
    const t = within(screen.getByRole("table", { name: "Daftar tiket" }));
    expect(t.getByRole("link", { name: "TK-20261113-7QPX" })).toHaveAttribute("href", "/admin/tiket/TK-20261113-7QPX");
    expect(t.getByText("VA sudah dibayar tapi status belum lunas")).toBeInTheDocument();
    expect(t.getByText("Pembayaran")).toBeInTheDocument();
    expect(t.getByText("Sudah saya bayar jam 9 pagi")).toBeInTheDocument();
    expect(t.getByText("Budi Santoso")).toBeInTheDocument();
    expect(t.getByText("0812-3456-7890")).toBeInTheDocument();
    expect(t.getByText("KK-20261113-DC4T")).toBeInTheDocument();
    const waktu = t.getByText("5 menit lalu");
    expect(waktu).toHaveAttribute("dateTime", "2026-11-13T02:55:00.000Z");
    expect(waktu).toHaveAttribute("title", "13 Nov 2026, 09.55 WIB");
    expect(t.getByText("dari Pembeli")).toBeInTheDocument();
    // tab per status tidak perlu kolom status
    expect(t.queryByRole("columnheader", { name: "Status" })).toBeNull();
    // kartu untuk layar < 1024 px juga menaut ke detail
    expect(screen.getAllByRole("link", { name: /TK-20261113-7QPX/ }).map((a) => a.getAttribute("href"))).toEqual(["/admin/tiket/TK-20261113-7QPX", "/admin/tiket/TK-20261113-7QPX"]);
  });

  it("tanpa pesanan dan pesan terakhir dari admin; kategori Lainnya", async () => {
    adminFetch.mockResolvedValue(balas([tiket({ order_code: null, last_sender_role: "admin", category: "lainnya", status: "answered" })]));
    await halaman({ status: "answered" });
    const t = within(screen.getByRole("table", { name: "Daftar tiket" }));
    expect(t.getByText("Lainnya")).toBeInTheDocument();
    expect(t.getByText("dari Admin")).toBeInTheDocument();
    expect(t.getByText("—")).toBeInTheDocument();
  });

  it("tab Semua tanpa status ke backend dan menampilkan kolom status", async () => {
    adminFetch.mockResolvedValue(balas([tiket({ status: "closed" }), tiket({ code: "TK-20261113-AB2C", status: "answered" })]));
    await halaman({ status: "semua" });
    expect(adminFetch).toHaveBeenCalledWith("/tickets?page=1&limit=20");
    expect(screen.getByRole("tab", { name: /Semua/ })).toHaveAttribute("aria-selected", "true");
    const t = within(screen.getByRole("table", { name: "Daftar tiket" }));
    expect(t.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(t.getByText("Ditutup")).toBeInTheDocument();
    expect(t.getByText("Dibalas")).toBeInTheDocument();
  });

  it("filter URL diteruskan; q dipangkas; nilai tak dikenal diabaikan", async () => {
    await halaman({ status: "closed", q: "  budi ", page: "2" });
    expect(adminFetch).toHaveBeenLastCalledWith("/tickets?status=closed&q=budi&page=2&limit=20");
    for (const sp of [{ status: "hacker", page: "abc" }, { status: "OPEN", page: "0", q: "   " }, { page: "99999999999" }]) {
      await halaman(sp);
      expect(adminFetch).toHaveBeenLastCalledWith("/tickets?status=open&page=1&limit=20");
    }
  });

  it("tanpa admin (requireAdmin melempar): backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(TiketPage({ searchParams: Promise.resolve({}) })).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("gagal: pesan + Coba lagi", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    await halaman();
    expect(screen.getByRole("alert")).toHaveTextContent("Daftar tiket belum bisa dimuat");
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });

  it("kosong per tab: pesan sesuai tab", async () => {
    adminFetch.mockResolvedValue(balas([], { counts: { open: 0, answered: 0, closed: 0 } }));
    await halaman();
    expect(screen.getByText("Tidak ada tiket yang menunggu")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    await halaman({ status: "semua" });
    expect(screen.getByText("Belum ada tiket")).toBeInTheDocument();
  });
});

describe("TiketTable", () => {
  const tabel = (o: Partial<Parameters<typeof TiketTable>[0]> = {}) =>
    render(<TiketTable rows={[tiket()]} tab="open" counts={COUNTS} page={1} total={1} sekarang={SEKARANG} {...o} />);

  it("pindah tab: status di URL, q dibawa, halaman kembali ke 1; tab Menunggu tanpa ?status", async () => {
    url.q = "q=budi&page=2";
    tabel();
    await userEvent.click(screen.getByRole("tab", { name: /Dibalas/ }));
    expect(replace).toHaveBeenLastCalledWith("/admin/tiket?q=budi&status=answered", { scroll: false });
    url.q = "status=closed";
    tabel({ tab: "closed" });
    await userEvent.click(screen.getAllByRole("tab", { name: /Menunggu/ }).at(-1)!);
    expect(replace).toHaveBeenLastCalledWith("/admin/tiket", { scroll: false });
  });

  it("pencarian ditunda ke URL dan mempertahankan tab", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    url.q = "status=answered";
    tabel({ tab: "answered" });
    fireEvent.change(screen.getByRole("searchbox", { name: "Cari tiket" }), { target: { value: " 0812 " } });
    expect(replace).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(450); });
    expect(replace).toHaveBeenCalledWith("/admin/tiket?status=answered&q=0812", { scroll: false });
  });

  it("tanpa counts (meta tidak lengkap): tab tetap tampil tanpa angka", () => {
    tabel({ counts: undefined });
    expect(screen.getByRole("tab", { name: "Menunggu" })).toHaveTextContent(/^Menunggu$/);
  });

  it("paginasi menjaga filter", () => {
    url.q = "status=closed&q=budi";
    tabel({ tab: "closed", total: 45 });
    expect(screen.getByRole("link", { name: /Berikutnya/ })).toHaveAttribute("href", "/admin/tiket?status=closed&q=budi&page=2");
    expect(screen.getByText("Halaman 1 dari 3")).toBeInTheDocument();
  });

  it("pencarian tanpa hasil -> Tiket tidak ditemukan + Hapus pencarian (tab tetap)", async () => {
    url.q = "status=closed&q=xyz";
    tabel({ rows: [], tab: "closed" });
    expect(screen.getByText("Tiket tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByText('Tidak ada tiket yang cocok dengan "xyz".')).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hapus pencarian" }));
    expect(replace).toHaveBeenCalledWith("/admin/tiket?status=closed", { scroll: false });
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("klik baris tabel membuka detail", async () => {
    tabel();
    await userEvent.click(within(screen.getByRole("table", { name: "Daftar tiket" })).getByText("Budi Santoso"));
    expect(push).toHaveBeenCalledWith("/admin/tiket/TK-20261113-7QPX");
  });
});

const detail = (o: Partial<DetailTiket> = {}): DetailTiket => ({
  code: "TK-20261113-7QPX", category: "pembayaran", subject: "VA sudah dibayar tapi status belum lunas", status: "answered",
  order_code: "KK-20261113-DC4T", created_at: "2026-11-13T02:00:00.000Z", last_message_at: "2026-11-13T02:30:00.000Z", last_sender_role: "admin",
  closed_at: null, closed_by: null,
  customer: { id: 7, full_name: "Budi Santoso", phone: "081234567890", email: "budi@mail.com" },
  order: { code: "KK-20261113-DC4T", status: "holding", total: 32_000, merchant_name: "Dapur Siti", created_at: "2026-11-13T01:50:00.000Z" },
  messages: [
    { id: 1, sender_role: "customer", sender_name: "Budi Santoso", body: "Sudah saya bayar jam 9 pagi.\nTolong dicek.", created_at: "2026-11-13T02:00:00.000Z" },
    { id: 2, sender_role: "admin", sender_name: "Dina", body: "Baik, kami cek ke Midtrans.", created_at: "2026-11-13T02:30:00.000Z" },
  ],
  ...o,
});
const buka = async (code = "TK-20261113-7QPX") => render(await DetailPage({ params: Promise.resolve({ code }) }));

describe("/admin/tiket/[code] detail", () => {
  beforeEach(() => adminFetch.mockResolvedValue({ ok: true, status: 200, data: detail() }));

  it("header: judul, kode, kategori, status; requireAdmin semua tingkat", async () => {
    await buka();
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(adminFetch).toHaveBeenCalledWith("/tickets/TK-20261113-7QPX");
    expect(screen.getByRole("heading", { level: 1, name: "VA sudah dibayar tapi status belum lunas" })).toBeInTheDocument();
    expect(screen.getByText("TK-20261113-7QPX")).toBeInTheDocument();
    expect(screen.getByText("Kategori Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Dibalas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Semua tiket" })).toHaveAttribute("href", "/admin/tiket");
  });

  it("percakapan: urutan dipertahankan, pembeli kiri vs admin kanan, nama pengirim, peran, waktu WIB, baris baru", async () => {
    await buka();
    const pesan = within(screen.getByRole("list", { name: "Pesan tiket" })).getAllByRole("listitem");
    expect(pesan).toHaveLength(2);
    expect(pesan[0]).toHaveTextContent("Budi Santoso · Pembeli");
    expect(pesan[0]).toHaveClass("items-start");
    expect(within(pesan[0]).getByText(/Sudah saya bayar jam 9 pagi\.\s+Tolong dicek\./)).toHaveClass("whitespace-pre-wrap");
    expect(within(pesan[0]).getByText("13 Nov 2026, 09.00 WIB")).toHaveAttribute("dateTime", "2026-11-13T02:00:00.000Z");
    expect(pesan[1]).toHaveTextContent("Dina · Admin");
    expect(pesan[1]).toHaveClass("items-end");
    expect(within(pesan[1]).getByText("Baik, kami cek ke Midtrans.")).toBeInTheDocument();
    expect(within(pesan[1]).getByText("13 Nov 2026, 09.30 WIB")).toBeInTheDocument();
  });

  it("pembeli: nama, WhatsApp wa.me aman, email, tautan tiket lain; pesanan terkait", async () => {
    await buka();
    const wa = screen.getByRole("link", { name: "0812-3456-7890" });
    expect(wa).toHaveAttribute("href", "https://wa.me/6281234567890");
    expect(wa).toHaveAttribute("target", "_blank");
    expect(wa.getAttribute("rel")).toContain("noopener");
    expect(screen.getByText("budi@mail.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tiket lain dari pembeli ini" })).toHaveAttribute("href", "/admin/tiket?status=semua&q=081234567890");
    const order = within(screen.getByRole("heading", { name: "Pesanan terkait" }).parentElement!);
    expect(order.getByText("KK-20261113-DC4T")).toBeInTheDocument();
    expect(order.getByText("Belum dikonfirmasi")).toBeInTheDocument();
    expect(order.getByText("Rp 32.000")).toBeInTheDocument();
    expect(order.getByText("Dapur Siti")).toBeInTheDocument();
  });

  it("belum ditutup: formulir balas + tombol Tutup tiket; tanpa pesanan dan tanpa email", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: detail({ status: "open", order: null, order_code: null, customer: { id: 7, full_name: "Budi Santoso", phone: "081234567890", email: null } }) });
    await buka();
    expect(screen.getByRole("textbox", { name: /Balasan untuk pembeli/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kirim balasan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tutup tiket" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pesanan terkait" })).toBeNull();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Menunggu")).toBeInTheDocument();
  });

  it("ditutup: info penutupan tampil; formulir balas dan tombol tutup disembunyikan", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: detail({ status: "closed", closed_by: "customer", closed_at: "2026-11-13T05:00:00.000Z" }) });
    await buka();
    expect(screen.getByRole("status")).toHaveTextContent("Tiket ditutup oleh pembeli pada 13 Nov 2026, 12.00 WIB.");
    expect(screen.getByText("Ditutup")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Kirim balasan" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tutup tiket" })).toBeNull();
    // percakapan tetap terbaca
    expect(screen.getByText("Baik, kami cek ke Midtrans.")).toBeInTheDocument();
  });

  it("404 dari backend atau kode tidak valid -> notFound (kode tidak valid tanpa panggilan backend)", async () => {
    await expect(DetailPage({ params: Promise.resolve({ code: "../users" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan." } });
    await expect(DetailPage({ params: Promise.resolve({ code: "TK-20261113-ZZZZ" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(adminFetch).toHaveBeenCalledWith("/tickets/TK-20261113-ZZZZ");
  });

  it("halaman tidak ditemukan: pesan + kembali ke daftar", () => {
    render(<TiketTidakDitemukan />);
    expect(screen.getByRole("heading", { level: 1, name: "Tiket tidak ditemukan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali ke daftar tiket" })).toHaveAttribute("href", "/admin/tiket");
  });

  it("gagal selain 404: pesan + Coba lagi; tanpa admin: backend tidak dipanggil", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    await buka();
    expect(screen.getByRole("alert")).toHaveTextContent("Tiket belum bisa dimuat");
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
    adminFetch.mockClear();
    requireAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(DetailPage({ params: Promise.resolve({ code: "TK-20261113-7QPX" }) })).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
});
