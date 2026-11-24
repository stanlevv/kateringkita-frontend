// Test halaman admin "Chat dilaporkan": daftar (kode pesanan, pelapor, alasan, waktu, kosong, gagal, paginasi), baca
// satu laporan (semua pesan, tanpa kotak ketik, 404, id tidak valid), dan penjagaan sesi admin.
// requireAdmin dan adminFetch diganti tiruan (mock), jadi test tidak memanggil backend.
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: (...args: unknown[]) => requireAdmin(...args) }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
import type { ChatReportDetail, ChatReportSummary } from "@/types/admin";
import ChatReportsPage from "./page";
import ChatReportDetailPage from "./[id]/page";

const report = (overrides: Partial<ChatReportSummary> = {}): ChatReportSummary => ({
  id: 12,
  order_code: "KK-20261124-AB12",
  reporter_role: "merchant",
  reporter_name: "Warung Bu Sari",
  reason: "Pembeli mengirim kata kasar berulang kali",
  created_at: "2026-11-24T03:05:00.000Z",
  reviewed_at: null,
  ...overrides,
});
const detail: ChatReportDetail = {
  ...report(),
  messages: [
    {
      id: 1,
      sender_role: "customer",
      body: "Halo, pesanan saya sudah jadi?",
      image_url: null,
      created_at: "2026-11-24T02:00:00.000Z",
    },
    {
      id: 2,
      sender_role: "merchant",
      body: "Sebentar ya kak",
      image_url: null,
      created_at: "2026-11-24T02:01:00.000Z",
    },
  ],
};
const ok = (data: unknown, meta?: object) => ({ ok: true, status: 200, data, meta });

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset();
});

describe("/admin/chat-dilaporkan daftar", () => {
  it("menampilkan kode pesanan, pelapor, alasan, waktu WIB, dan menaut ke detail", async () => {
    adminFetch.mockResolvedValue(ok([report()], { page: 1, limit: 20, total: 1 }));
    render(await ChatReportsPage({ searchParams: Promise.resolve({}) }));
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(adminFetch).toHaveBeenCalledWith("/chat-reports?page=1&limit=20");
    expect(screen.getByText("KK-20261124-AB12")).toBeInTheDocument();
    expect(screen.getByText(/Dilaporkan Penjual: Warung Bu Sari/)).toBeInTheDocument();
    expect(screen.getByText("Pembeli mengirim kata kasar berulang kali")).toBeInTheDocument();
    expect(screen.getByText(/24 Nov 2026 · 10\.05/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /KK-20261124-AB12/ })).toHaveAttribute("href", "/admin/chat-dilaporkan/12");
  });

  it("akun pelapor dihapus (reporter_name null) -> (akun dihapus)", async () => {
    adminFetch.mockResolvedValue(ok([report({ reporter_name: null })], { page: 1, limit: 20, total: 1 }));
    render(await ChatReportsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Dilaporkan Penjual: \(akun dihapus\)/)).toBeInTheDocument();
  });

  it("nomor halaman dari URL diteruskan ke backend; nilai ngawur menjadi halaman 1", async () => {
    adminFetch.mockResolvedValue(ok([report()], { page: 3, limit: 20, total: 50 }));
    await ChatReportsPage({ searchParams: Promise.resolve({ page: "3" }) });
    expect(adminFetch).toHaveBeenLastCalledWith("/chat-reports?page=3&limit=20");
    await ChatReportsPage({ searchParams: Promise.resolve({ page: "abc" }) });
    expect(adminFetch).toHaveBeenLastCalledWith("/chat-reports?page=1&limit=20");
  });

  it("daftar kosong menampilkan pesan kosong; gagal menampilkan LoadError", async () => {
    adminFetch.mockResolvedValue(ok([], { page: 1, limit: 20, total: 0 }));
    const { unmount } = render(await ChatReportsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Belum ada chat yang dilaporkan")).toBeInTheDocument();
    unmount();
    adminFetch.mockResolvedValue({ ok: false, status: 500, data: undefined });
    render(await ChatReportsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Daftar laporan belum bisa dimuat")).toBeInTheDocument();
  });

  it("tanpa sesi admin requireAdmin mengalihkan dan backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(ChatReportsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT");
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("/admin/chat-dilaporkan/<id> baca", () => {
  const renderDetail = async (id: string) => render(await ChatReportDetailPage({ params: Promise.resolve({ id }) }));

  it("menampilkan alasan dan semua pesan berurutan, tanpa kotak ketik", async () => {
    adminFetch.mockResolvedValue(ok(detail));
    await renderDetail("12");
    expect(adminFetch).toHaveBeenCalledWith("/chat-reports/12");
    expect(screen.getByText("Pembeli mengirim kata kasar berulang kali")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Halo, pesanan saya sudah jadi?");
    expect(items[1]).toHaveTextContent("Sebentar ya kak");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("foto pesan tampil sebagai gambar bertaut", async () => {
    adminFetch.mockResolvedValue(
      ok({ ...detail, messages: [{ ...detail.messages[0], body: null, image_url: "https://cdn.example/a.jpg" }] }),
    );
    await renderDetail("12");
    expect(screen.getByRole("img", { name: "Foto dari pembeli" })).toBeInTheDocument();
  });

  it("id tidak valid atau 404 memanggil notFound; id tidak valid tanpa memanggil backend", async () => {
    await expect(renderDetail("abc")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue({ ok: false, status: 404, data: undefined });
    await expect(renderDetail("99")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("akun pelapor dihapus (reporter_name null) -> (akun dihapus)", async () => {
    adminFetch.mockResolvedValue(ok({ ...detail, reporter_name: null }));
    await renderDetail("12");
    expect(screen.getByText(/Dilaporkan Penjual: \(akun dihapus\)/)).toBeInTheDocument();
  });

  it("gagal selain 404 menampilkan LoadError; tanpa sesi admin dialihkan", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 500, data: undefined });
    await renderDetail("12");
    expect(screen.getByText("Laporan belum bisa dimuat")).toBeInTheDocument();
    requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(renderDetail("12")).rejects.toThrow("NEXT_REDIRECT");
  });
});
