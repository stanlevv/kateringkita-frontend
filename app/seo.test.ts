import { describe, expect, it } from "vitest";
import { config } from "@/proxy";
import { PRIVATE_PATHS, SITE_URL } from "@/lib/site";
import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO", () => {
  it("robots menutup rute di balik login dan menunjuk sitemap", () => {
    const r = robots();
    expect(r.rules).toMatchObject({ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS });
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("setiap rute yang dijaga proxy.ts ikut ditutup di robots", () => {
    for (const m of config.matcher) expect(PRIVATE_PATHS).toContain(m.replace("/:path*", ""));
  });

  it("sitemap hanya berisi halaman publik", () => {
    expect(sitemap().map((e) => new URL(e.url).pathname)).toEqual(["/", "/register", "/login"]);
  });
});
