import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (n === "kk_skenario" && jar.value ? { name: n, value: jar.value } : undefined),
  }),
}));

import { getSkenario, SKENARIO } from "./skenario";

afterEach(() => {
  vi.unstubAllEnvs();
  jar.value = undefined;
});

describe("getSkenario", () => {
  it("development membaca cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jar.value = "gagal-muat";
    expect(await getSkenario()).toBe("gagal-muat");
  });
  it("production selalu null (Review Focus 1)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    jar.value = "gagal-muat";
    expect(await getSkenario()).toBeNull();
  });
  it("nilai tak dikenal diabaikan", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jar.value = "ngawur";
    expect(await getSkenario()).toBeNull();
  });
  it("SKENARIO punya label & deskripsi untuk 11 nilai (tanpa sesi-habis)", () => {
    expect(SKENARIO).toHaveLength(11);
    expect(SKENARIO.map((s) => s.id)).not.toContain("sesi-habis");
    for (const s of SKENARIO) {
      expect(s.label).toBeTruthy();
      expect(s.deskripsi).toBeTruthy();
    }
  });
});

describe("D12 skenario gagal-sinkron", () => {
  it("terdaftar dengan label tanpa istilah teknis", () => {
    const s = SKENARIO.find((x) => x.id === "gagal-sinkron");
    expect(s?.label).toBe("Gagal menyegarkan");
    expect(s?.deskripsi).not.toMatch(/polling|sinkron|server|503|fetch/i);
  });
});
