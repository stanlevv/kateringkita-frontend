// Test sitemap: toko bermenu dan area layak indeks terdaftar, galat backend tidak merusak sitemap.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  merchants: (async () => ({})) as (id?: number) => Promise<unknown>,
  points: (async () => ({})) as () => Promise<unknown>,
}));
vi.mock("@/services/catalog.service", () => ({ getPublicMerchants: (id?: number) => state.merchants(id) }));
vi.mock("@/services/meta.service", () => ({ getPickupPoints: () => state.points() }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/site", () => ({ SITE_URL: "https://kk.test" }));

import sitemap from "./sitemap";

const urls = async () => (await sitemap()).map((e) => e.url);
const STATIC = ["https://kk.test", "https://kk.test/register", "https://kk.test/toko"];
const store = (slug: string, menu_count = 1) => ({ slug, menu_count });

beforeEach(() => {
  state.merchants = async () => ({ data: [] });
  state.points = async () => ({ data: [] });
});

describe("sitemap", () => {
  it("memuat statis dan tiap toko bermenu, tanpa /login dan tanpa toko tanpa menu", async () => {
    state.merchants = async () => ({ data: [store("a"), store("b"), store("kosong", 0)] });
    const u = await urls();
    expect(u).toEqual([...STATIC, "https://kk.test/toko/a", "https://kk.test/toko/b"]);
    expect(u).not.toContain("https://kk.test/login");
  });

  it("area dengan 2 toko bermenu ada, area dengan 1 toko bermenu tidak", async () => {
    state.points = async () => ({
      data: [
        { id: 1, name: "Gerbang Utara" },
        { id: 2, name: "Kantin" },
        { id: 3, name: "Gazebo" },
      ],
    });
    state.merchants = async (id) => {
      if (id === 1) return { data: [store("a"), store("b")] };
      if (id === 2) return { data: [store("a"), store("kosong", 0)] };
      if (id === 3) return { data: [store("a"), store("b"), store("c")] };
      return { data: [] };
    };
    const e = await sitemap();
    const u = e.map((x) => x.url);
    expect(u).toContain("https://kk.test/area/1-gerbang-utara");
    expect(u).not.toContain("https://kk.test/area/2-kantin");
    expect(u).toContain("https://kk.test/area/3-gazebo");
    expect(e.find((x) => x.url.endsWith("/area/1-gerbang-utara"))).toMatchObject({
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  it("titik ambil gagal: hanya halaman statis", async () => {
    state.points = async () => ({ error: { code: "X", message: "x" } });
    expect(await urls()).toEqual(STATIC);
  });

  it("daftar toko per area gagal: hanya halaman statis", async () => {
    state.points = async () => ({ data: [{ id: 1, name: "A" }] });
    state.merchants = async (id) => (id ? { error: { code: "X", message: "x" } } : { data: [store("a")] });
    expect(await urls()).toEqual(STATIC);
  });

  it("tetap mengembalikan halaman statis saat service mengembalikan error", async () => {
    state.merchants = async () => ({ error: { code: "X", message: "x" } });
    expect(await urls()).toEqual(STATIC);
  });

  it("tetap mengembalikan halaman statis saat service melempar", async () => {
    state.merchants = async () => {
      throw new Error("down");
    };
    expect(await urls()).toEqual(STATIC);
  });
});
