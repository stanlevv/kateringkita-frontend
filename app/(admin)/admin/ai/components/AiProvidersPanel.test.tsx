import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AiProviderList, AiProvider } from "@/types/ai";

const refresh = vi.fn();
const createAiProvider = vi.fn();
const updateAiProvider = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/ai", () => ({
  createAiProvider: (...args: unknown[]) => createAiProvider(...args),
  updateAiProvider: (...args: unknown[]) => updateAiProvider(...args),
  deleteAiProvider: vi.fn(),
  testAiProvider: vi.fn(),
}));

import { AiProvidersPanel } from "./AiProvidersPanel";

const provider = (overrides: Partial<AiProvider>): AiProvider => ({
  id: 1,
  provider: "groq",
  provider_name: "Groq",
  label: "Groq gratis",
  model: "llama-3.3-70b-versatile",
  key_hint: "ABCD",
  priority: 1,
  is_active: true,
  last_ok_at: null,
  last_error: null,
  last_error_at: null,
  cooldown_until: null,
  ...overrides,
});
const data: AiProviderList = {
  providers: [
    provider({}),
    provider({
      id: 2,
      provider: "openrouter",
      provider_name: "OpenRouter",
      label: "OR",
      priority: 2,
      cooldown_until: new Date(Date.now() + 600_000).toISOString(),
      last_error: "Kuota/batas pemakaian habis (429).",
      last_error_at: new Date().toISOString(),
    }),
    provider({ id: 3, label: "Cadangan mati", priority: 3, is_active: false }),
  ],
  env_gemini: null,
};

afterEach(() => vi.clearAllMocks());

describe("halaman admin AI", () => {
  it("urutan, status siap/istirahat/nonaktif, key hanya 4 karakter, error terakhir", () => {
    render(<AiProvidersPanel data={data} />);
    const cards = within(screen.getByRole("list", { name: "Urutan penyedia" })).getAllByRole("listitem");
    expect(within(cards[0]).getByText("Siap dipakai")).toBeInTheDocument();
    expect(within(cards[0]).getByText("••••ABCD")).toBeInTheDocument();
    expect(within(cards[1]).getByText(/Istirahat s\.d\./)).toBeInTheDocument();
    expect(within(cards[1]).getByText(/Kuota\/batas pemakaian habis/)).toBeInTheDocument();
    expect(within(cards[2]).getByText("Nonaktif")).toBeInTheDocument();
    expect(screen.getByText(/tidak ada \(GEMINI_API_KEY di server kosong\)/)).toBeInTheDocument();
  });

  it("ubah tanpa mengisi key → key tidak dikirim; tambah → penyedia & key dikirim", async () => {
    const user = userEvent.setup();
    updateAiProvider.mockResolvedValue({ data: provider({}) });
    createAiProvider.mockResolvedValue({ data: provider({ id: 9 }) });
    render(<AiProvidersPanel data={data} />);

    await user.click(
      within(within(screen.getByRole("list", { name: "Urutan penyedia" })).getAllByRole("listitem")[0]).getByRole(
        "button",
        { name: "Ubah" },
      ),
    );
    const editDialog = screen.getByRole("dialog", { name: "Ubah Groq gratis" });
    await user.clear(within(editDialog).getByLabelText(/Prioritas/));
    await user.type(within(editDialog).getByLabelText(/Prioritas/), "5");
    await user.click(within(editDialog).getByRole("button", { name: "Simpan perubahan" }));
    expect(updateAiProvider).toHaveBeenCalledWith(1, {
      label: "Groq gratis",
      model: "llama-3.3-70b-versatile",
      priority: 5,
    });
    expect(refresh).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Tambah penyedia" }));
    const addDialog = screen.getByRole("dialog", { name: "Tambah penyedia AI" });
    await user.click(within(addDialog).getByRole("radio", { name: "Groq" }));
    await user.type(within(addDialog).getByLabelText(/API key/), "gsk_kunci_1234567890");
    await user.click(within(addDialog).getByRole("button", { name: "Tambah penyedia" }));
    expect(createAiProvider).toHaveBeenCalledWith({
      label: "Groq",
      model: "llama-3.3-70b-versatile",
      priority: 100,
      api_key: "gsk_kunci_1234567890",
      provider: "groq",
      is_active: true,
    });
  });
});
