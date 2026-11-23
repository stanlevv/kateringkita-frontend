// Test skenario pratinjau: dibaca dari cookie dan selalu mati di production.
import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "kk_skenario" && jar.value ? { name, value: jar.value } : undefined),
  }),
}));

import { getScenario, SCENARIOS } from "./scenario";

afterEach(() => {
  vi.unstubAllEnvs();
  jar.value = undefined;
});

describe("getScenario", () => {
  it("development membaca cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jar.value = "gagal-muat";
    expect(await getScenario()).toBe("gagal-muat");
  });
  it("production selalu null (Review Focus 1)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    jar.value = "gagal-muat";
    expect(await getScenario()).toBeNull();
  });
  it("nilai tak dikenal diabaikan", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jar.value = "ngawur";
    expect(await getScenario()).toBeNull();
  });
  it("SCENARIOS punya label & deskripsi untuk 11 nilai (tanpa sesi-habis)", () => {
    expect(SCENARIOS).toHaveLength(11);
    expect(SCENARIOS.map((scenario) => scenario.id)).not.toContain("sesi-habis");
    for (const scenario of SCENARIOS) {
      expect(scenario.label).toBeTruthy();
      expect(scenario.description).toBeTruthy();
    }
  });
});

describe("D12 skenario gagal-sinkron", () => {
  it("terdaftar dengan label tanpa istilah teknis", () => {
    const scenario = SCENARIOS.find((item) => item.id === "gagal-sinkron");
    expect(scenario?.label).toBe("Gagal menyegarkan");
    expect(scenario?.description).not.toMatch(/polling|sinkron|server|503|fetch/i);
  });
});
