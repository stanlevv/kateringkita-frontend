import { afterEach, describe, expect, it, vi } from "vitest";

const { requireMerchant } = vi.hoisted(() => ({ requireMerchant: vi.fn(async () => ({})) }));
vi.mock("@/lib/session", () => ({ requireMerchant }));
vi.mock("@/lib/skenario", async (orig) => ({
  ...(await orig<typeof import("@/lib/skenario")>()),
  getSkenario: async () => null,
}));

import PratinjauPage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
  requireMerchant.mockClear();
});

describe("/pratinjau", () => {
  it("production -> notFound() sebelum requireMerchant (Review Focus 1)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(PratinjauPage()).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404") });
    expect(requireMerchant).not.toHaveBeenCalled();
  });
  it("development merender daftar skenario", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const el = await PratinjauPage();
    expect(requireMerchant).toHaveBeenCalled();
    expect(JSON.stringify(el)).toContain("Hapus skenario");
    expect(el.type).toBe("div"); // layout sudah punya <main>; tidak boleh bersarang
    expect(JSON.stringify(el)).not.toContain("Sesi habis");
  });
});
