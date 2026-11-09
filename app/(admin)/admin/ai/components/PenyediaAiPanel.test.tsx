import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DaftarAi, PenyediaAi } from "@/types/ai";

const refresh = vi.fn();
const tambahPenyediaAi = vi.fn();
const ubahPenyediaAi = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/ai", () => ({
  tambahPenyediaAi: (...a: unknown[]) => tambahPenyediaAi(...a),
  ubahPenyediaAi: (...a: unknown[]) => ubahPenyediaAi(...a),
  hapusPenyediaAi: vi.fn(),
  ujiPenyediaAi: vi.fn(),
}));

import { PenyediaAiPanel } from "./PenyediaAiPanel";

const p = (o: Partial<PenyediaAi>): PenyediaAi => ({
  id: 1, provider: "groq", provider_name: "Groq", label: "Groq gratis", model: "llama-3.3-70b-versatile", key_hint: "ABCD", priority: 1,
  is_active: true, last_ok_at: null, last_error: null, last_error_at: null, cooldown_until: null, ...o,
});
const data: DaftarAi = {
  providers: [
    p({}),
    p({ id: 2, provider: "openrouter", provider_name: "OpenRouter", label: "OR", priority: 2, cooldown_until: new Date(Date.now() + 600_000).toISOString(), last_error: "Kuota/batas pemakaian habis (429).", last_error_at: new Date().toISOString() }),
    p({ id: 3, label: "Cadangan mati", priority: 3, is_active: false }),
  ],
  env_gemini: null,
};

afterEach(() => vi.clearAllMocks());

describe("halaman admin AI", () => {
  it("urutan, status siap/istirahat/nonaktif, key hanya 4 karakter, error terakhir", () => {
    render(<PenyediaAiPanel data={data} />);
    const kartu = within(screen.getByRole("list", { name: "Urutan penyedia" })).getAllByRole("listitem");
    expect(within(kartu[0]).getByText("Siap dipakai")).toBeInTheDocument();
    expect(within(kartu[0]).getByText("••••ABCD")).toBeInTheDocument();
    expect(within(kartu[1]).getByText(/Istirahat s\.d\./)).toBeInTheDocument();
    expect(within(kartu[1]).getByText(/Kuota\/batas pemakaian habis/)).toBeInTheDocument();
    expect(within(kartu[2]).getByText("Nonaktif")).toBeInTheDocument();
    expect(screen.getByText(/tidak ada \(GEMINI_API_KEY di server kosong\)/)).toBeInTheDocument();
  });

  it("ubah tanpa mengisi key → key tidak dikirim; tambah → penyedia & key dikirim", async () => {
    const u = userEvent.setup();
    ubahPenyediaAi.mockResolvedValue({ data: p({}) });
    tambahPenyediaAi.mockResolvedValue({ data: p({ id: 9 }) });
    render(<PenyediaAiPanel data={data} />);

    await u.click(within(within(screen.getByRole("list", { name: "Urutan penyedia" })).getAllByRole("listitem")[0]).getByRole("button", { name: "Ubah" }));
    const ubah = screen.getByRole("dialog", { name: "Ubah Groq gratis" });
    await u.clear(within(ubah).getByLabelText(/Prioritas/));
    await u.type(within(ubah).getByLabelText(/Prioritas/), "5");
    await u.click(within(ubah).getByRole("button", { name: "Simpan perubahan" }));
    expect(ubahPenyediaAi).toHaveBeenCalledWith(1, { label: "Groq gratis", model: "llama-3.3-70b-versatile", priority: 5 });
    expect(refresh).toHaveBeenCalled();

    await u.click(screen.getByRole("button", { name: "Tambah penyedia" }));
    const tambah = screen.getByRole("dialog", { name: "Tambah penyedia AI" });
    await u.click(within(tambah).getByRole("radio", { name: "Groq" }));
    await u.type(within(tambah).getByLabelText(/API key/), "gsk_kunci_1234567890");
    await u.click(within(tambah).getByRole("button", { name: "Tambah penyedia" }));
    expect(tambahPenyediaAi).toHaveBeenCalledWith({
      label: "Groq", model: "llama-3.3-70b-versatile", priority: 100, api_key: "gsk_kunci_1234567890", provider: "groq", is_active: true,
    });
  });
});
