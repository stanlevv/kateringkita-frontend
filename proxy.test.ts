import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

describe("G-10 proxy", () => {
  it("tanpa sesi -> /login?next= berisi path + query", () => {
    const res = proxy(new NextRequest("http://localhost:3000/menu?q=a"));
    expect(res.status).toBe(307);
    const to = new URL(res.headers.get("location")!);
    expect(to.pathname).toBe("/login");
    expect(to.searchParams.get("next")).toBe("/menu?q=a");
  });
  it("parameter _rsc dibuang dari next", () => {
    const to = new URL(proxy(new NextRequest("http://localhost:3000/menu?q=a&_rsc=abc")).headers.get("location")!);
    expect(to.searchParams.get("next")).toBe("/menu?q=a");
    const polos = new URL(proxy(new NextRequest("http://localhost:3000/menu?_rsc=abc")).headers.get("location")!);
    expect(polos.searchParams.get("next")).toBe("/menu");
  });
  it("dengan sesi -> lanjut", () => {
    const res = proxy(new NextRequest("http://localhost:3000/menu", { headers: { cookie: "kk_session=x" } }));
    expect(res.headers.get("location")).toBeNull();
  });
  it("/admin/verifikasi tanpa sesi -> /login dengan next", () => {
    const to = new URL(proxy(new NextRequest("http://localhost:3000/admin/verifikasi?s=1")).headers.get("location")!);
    expect(to.pathname).toBe("/login");
    expect(to.searchParams.get("next")).toBe("/admin/verifikasi?s=1");
    expect(config.matcher).toContain("/admin/:path*");
  });
  it("matcher mencakup semua rute dashboard", () => {
    for (const r of ["dashboard", "menu", "pesanan", "laporan", "promo", "ulasan", "pengaturan", "template-wa", "copilot", "pratinjau"]) {
      expect(config.matcher).toContain(`/${r}/:path*`);
    }
  });
});
