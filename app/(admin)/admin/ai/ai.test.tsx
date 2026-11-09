import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PemakaianAi } from "@/types/ai";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }), usePathname: () => "/admin/ai" }));
vi.mock("@/app/actions/admin/ai", () => ({ tambahPenyediaAi: vi.fn(), ubahPenyediaAi: vi.fn(), hapusPenyediaAi: vi.fn(), ujiPenyediaAi: vi.fn() }));
import AdminAiPage from "./page";

const hari = (t: string, token = 0, panggilan = 0, gagal = 0) => ({ tanggal: t, token, panggilan, gagal });
const pakai: PemakaianAi = {
  hari: 7,
  ringkas: { panggilan: 1240, gagal: 31, token: 1234567, token_masuk: 1000000, token_keluar: 234567, rata_ms: 1830 },
  per_penyedia: [
    { provider_id: 1, provider: "groq", label: "Groq gratis", model: "llama-3.3-70b-versatile", panggilan: 1200, gagal: 30, token: 1200000, rata_ms: 900, terakhir: "2026-11-10T03:00:00.000Z" },
    { provider_id: null, provider: "gemini", label: "GEMINI_API_KEY (env)", model: "gemini-2.0-flash", panggilan: 40, gagal: 1, token: 34567, rata_ms: null, terakhir: "2026-11-09T03:00:00.000Z" },
  ],
  per_fitur: [{ fitur: "rekomendasi", panggilan: 1000, gagal: 20, token: 1000000 }, { fitur: "asisten", panggilan: 240, gagal: 11, token: 234567 }],
  per_hari: [hari("2026-11-04"), hari("2026-11-05", 120, 3), hari("2026-11-06"), hari("2026-11-07"), hari("2026-11-08"), hari("2026-11-09"), hari("2026-11-10", 900, 5, 1)],
  gagal_terakhir: [{ created_at: "2026-11-10T02:00:00.000Z", label: "Groq gratis", model: "llama", fitur: "rekomendasi", error: "Kuota/batas pemakaian habis (429)." }],
};
const providers = { ok: true, status: 200, data: { providers: [], env_gemini: null } };
const balas = (usage: unknown) => adminFetch.mockImplementation((p: string) => Promise.resolve(p === "/ai-providers" ? providers : usage));

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ user: { full_name: "Dina" }, merchant: null });
  adminFetch.mockReset();
});

describe("halaman AI: pemakaian", () => {
  it("rentang dari URL (7 bawaan, 30, lainnya → 7) diteruskan ke backend", async () => {
    balas({ ok: true, status: 200, data: pakai });
    for (const [q, days] of [[undefined, 7], ["30", 30], ["99", 7]] as const) {
      render(await AdminAiPage({ searchParams: Promise.resolve({ hari: q }) }));
      expect(adminFetch).toHaveBeenLastCalledWith(`/ai-usage?days=${days}`);
    }
    expect(requireAdmin).toHaveBeenCalled();
  });

  it("KPI, grafik token per hari, tabel penyedia/fitur/gagal", async () => {
    balas({ ok: true, status: 200, data: pakai });
    render(await AdminAiPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("link", { name: "7 hari" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "30 hari" })).toHaveAttribute("href", "/admin/ai?hari=30");
    expect(screen.getByText("1.234.567")).toBeInTheDocument();
    expect(screen.getByText("Masuk 1.000.000 · keluar 234.567")).toBeInTheDocument();
    expect(screen.getByText("3% dari panggilan")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Legenda" })).toBeNull();
    const batang = screen.getAllByRole("button", { name: /token$/ });
    expect(batang).toHaveLength(7);
    expect(batang[1]).toHaveAccessibleName("5 Nov: 120 token");
    fireEvent.focus(batang[6]);
    expect(screen.getByRole("status")).toHaveTextContent("10 Nov · 900 token");
    const groq = screen.getByRole("row", { name: /llama-3\.3-70b-versatile/ });
    expect(within(groq).getByText("30 (3%)")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /GEMINI_API_KEY/ })).getByText("-")).toBeInTheDocument();
    expect(screen.getAllByRole("row", { name: /Rekomendasi pembeli/ })[0]).toHaveTextContent("1.000.000");
    expect(screen.getByText("Kuota/batas pemakaian habis (429).")).toBeInTheDocument();
  });

  it("belum ada pemakaian: pesan kosong tanpa tabel; gagal muat tidak menyembunyikan penyedia", async () => {
    const kosong = { ...pakai, ringkas: { ...pakai.ringkas, panggilan: 0, gagal: 0, token: 0 }, per_penyedia: [], per_fitur: [], gagal_terakhir: [],
      per_hari: pakai.per_hari.map((h) => ({ ...h, token: 0, panggilan: 0, gagal: 0 })) };
    balas({ ok: true, status: 200, data: kosong });
    render(await AdminAiPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Belum ada pemakaian AI di rentang ini.")).toBeInTheDocument();
    expect(screen.queryByText("Per penyedia")).toBeNull();
    balas({ ok: false, status: 500, error: { code: "X", message: "x" } });
    render(await AdminAiPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Pemakaian AI belum bisa dimuat")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Urutan penyedia" }).length).toBeGreaterThan(0);
  });
});
