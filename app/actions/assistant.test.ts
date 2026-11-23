// Test server action askAssistant (app/actions/assistant.ts): pertanyaan dirapikan dan dibatasi 1–500 karakter.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  merchantFetch: (...args: unknown[]) => merchantFetch(...args),
}));
import { askAssistant } from "./assistant";

beforeEach(() => {
  merchantFetch.mockReset();
  requireMerchant.mockClear();
});

describe("F17 askAssistant", () => {
  it("POST /merchant/assistant dengan pertanyaan yang dirapikan", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { answer: "ok" } });
    expect(await askAssistant("  Halo  ")).toEqual({ data: { answer: "ok" } });
    expect(requireMerchant).toHaveBeenCalled();
    expect(merchantFetch).toHaveBeenCalledWith("/assistant", {
      method: "POST",
      body: JSON.stringify({ question: "Halo" }),
    });
  });
  it("kosong / terlalu panjang / bukan teks -> galat tanpa API", async () => {
    for (const question of ["   ", "x".repeat(501), 5 as never])
      expect("error" in (await askAssistant(question))).toBe(true);
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});
