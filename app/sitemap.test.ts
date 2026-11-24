// Test sitemap: halaman toko ikut terdaftar, dan galat backend tidak merusak sitemap.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ load: (async () => ({})) as () => Promise<unknown> }));
vi.mock("@/services/catalog.service", () => ({ getPublicMerchants: () => state.load() }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/site", () => ({ SITE_URL: "https://kk.test" }));

import sitemap from "./sitemap";

const urls = async () => (await sitemap()).map((e) => e.url);
const STATIC = ["https://kk.test", "https://kk.test/register", "https://kk.test/toko"];

beforeEach(() => {
  state.load = async () => ({ data: [] });
});

describe("sitemap", () => {
  it("memuat beranda, register, /toko, dan tiap toko tanpa /login", async () => {
    state.load = async () => ({ data: [{ slug: "a" }, { slug: "b" }] });
    const u = await urls();
    expect(u).toEqual([...STATIC, "https://kk.test/toko/a", "https://kk.test/toko/b"]);
    expect(u).not.toContain("https://kk.test/login");
  });

  it("tetap mengembalikan halaman statis saat service mengembalikan error", async () => {
    state.load = async () => ({ error: { code: "X", message: "x" } });
    expect(await urls()).toEqual(STATIC);
  });

  it("tetap mengembalikan halaman statis saat service melempar", async () => {
    state.load = async () => {
      throw new Error("down");
    };
    expect(await urls()).toEqual(STATIC);
  });
});
