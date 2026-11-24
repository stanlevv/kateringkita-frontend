// Test /pratinjau: 404 di production sebelum requireMerchant, dan daftar skenario di development.
import { afterEach, describe, expect, it, vi } from "vitest";

const { requireMerchant } = vi.hoisted(() => ({ requireMerchant: vi.fn(async () => ({})) }));
vi.mock("@/services/auth.service", () => ({ requireMerchant }));
vi.mock("@/lib/scenario", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/scenario")>()),
  getScenario: async () => null,
}));

import PreviewPage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
  requireMerchant.mockClear();
});

describe("/pratinjau", () => {
  it("production -> notFound() sebelum requireMerchant (Review Focus 1)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(PreviewPage()).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404"),
    });
    expect(requireMerchant).not.toHaveBeenCalled();
  });
  it("development merender daftar skenario", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const element = await PreviewPage();
    expect(requireMerchant).toHaveBeenCalled();
    expect(JSON.stringify(element)).toContain("Hapus skenario");
    expect(element.type).toBe("div"); // layout sudah punya <main>; tidak boleh bersarang
    expect(JSON.stringify(element)).not.toContain("Sesi habis");
  });
});
