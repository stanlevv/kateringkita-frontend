import { beforeEach, describe, expect, it, vi } from "vitest";

const getScenario = vi.fn();
vi.mock("@/lib/scenario", () => ({ getScenario: () => getScenario() }));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (orig) => ({
  ...(await orig<typeof import("@/services/api")>()),
  merchantFetch: (...a: unknown[]) => merchantFetch(...a),
}));
import { setStoreOpen } from "./store";

beforeEach(() => {
  getScenario.mockReset();
  merchantFetch.mockReset();
  merchantFetch.mockImplementation(async (_p: string, init: { body: string }) => ({
    ok: true,
    status: 200,
    data: JSON.parse(init.body),
  }));
});

describe("SH-E1 setStoreOpen", () => {
  it("wajib sesi: requireMerchant dipanggil", async () => {
    getScenario.mockResolvedValue(null);
    requireMerchant.mockClear();
    await setStoreOpen(true);
    expect(requireMerchant).toHaveBeenCalledOnce();
  });
  it("normal -> PATCH /status dengan is_open, hasil dari server", async () => {
    getScenario.mockResolvedValue(null);
    expect(await setStoreOpen(false)).toEqual({ data: { is_open: false } });
    expect(merchantFetch).toHaveBeenCalledWith("/status", {
      method: "PATCH",
      body: JSON.stringify({ is_open: false }),
    });
  });
  it("server gagal -> error server", async () => {
    getScenario.mockResolvedValue(null);
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: "INTERNAL_ERROR", message: "Dari server" },
    });
    expect(await setStoreOpen(true)).toEqual({ error: { code: "INTERNAL_ERROR", message: "Dari server" } });
  });
  it("skenario gagal-aksi -> error tanpa memanggil server", async () => {
    getScenario.mockResolvedValue("gagal-aksi");
    const r = await setStoreOpen(false);
    expect("error" in r && r.error.message).toBeTruthy();
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});
