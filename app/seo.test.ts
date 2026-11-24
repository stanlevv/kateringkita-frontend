// Test SEO: robots.txt menutup rute di balik login, selaras dengan proxy.ts, dan sitemap hanya halaman publik.
import { describe, expect, it, vi } from "vitest";
import { config } from "@/proxy";
import { PRIVATE_PATHS, SITE_URL } from "@/lib/site";
vi.mock("@/services/catalog.service", () => ({ getPublicMerchants: async () => ({ data: [] }) }));

import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO", () => {
  it("robots menutup rute di balik login dan menunjuk sitemap", () => {
    const robotsFile = robots();
    expect(robotsFile.rules).toMatchObject({ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS });
    expect(robotsFile.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("setiap rute yang dijaga proxy.ts ikut ditutup di robots", () => {
    for (const matcher of config.matcher) expect(PRIVATE_PATHS).toContain(matcher.replace("/:path*", ""));
  });

  it("sitemap hanya berisi halaman publik", async () => {
    expect((await sitemap()).map((entry) => new URL(entry.url).pathname)).toEqual(["/", "/register", "/toko"]);
  });
});
