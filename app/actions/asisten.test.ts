import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), merchantFetch: (...a: unknown[]) => merchantFetch(...a) }));
import { tanyaAsisten } from "./asisten";

beforeEach(() => { merchantFetch.mockReset(); requireMerchant.mockClear(); });

describe("F17 tanyaAsisten", () => {
  it("POST /merchant/assistant dengan pertanyaan yang dirapikan", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { answer: "ok" } });
    expect(await tanyaAsisten("  Halo  ")).toEqual({ data: { answer: "ok" } });
    expect(requireMerchant).toHaveBeenCalled();
    expect(merchantFetch).toHaveBeenCalledWith("/assistant", { method: "POST", body: JSON.stringify({ question: "Halo" }) });
  });
  it("kosong / terlalu panjang / bukan teks -> galat tanpa API", async () => {
    for (const q of ["   ", "x".repeat(501), 5 as never]) expect("error" in (await tanyaAsisten(q))).toBe(true);
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});
