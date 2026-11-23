import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

describe("G-10 proxy", () => {
  it("tanpa sesi -> /login?next= berisi path + query", () => {
    const response = proxy(new NextRequest("http://localhost:3000/menu?q=a"));
    expect(response.status).toBe(307);
    const loginUrl = new URL(response.headers.get("location")!);
    expect(loginUrl.pathname).toBe("/login");
    expect(loginUrl.searchParams.get("next")).toBe("/menu?q=a");
  });
  it("parameter _rsc dibuang dari next", () => {
    const loginUrl = new URL(
      proxy(new NextRequest("http://localhost:3000/menu?q=a&_rsc=abc")).headers.get("location")!,
    );
    expect(loginUrl.searchParams.get("next")).toBe("/menu?q=a");
    const plainLoginUrl = new URL(
      proxy(new NextRequest("http://localhost:3000/menu?_rsc=abc")).headers.get("location")!,
    );
    expect(plainLoginUrl.searchParams.get("next")).toBe("/menu");
  });
  it("dengan sesi -> lanjut", () => {
    const response = proxy(new NextRequest("http://localhost:3000/menu", { headers: { cookie: "kk_session=x" } }));
    expect(response.headers.get("location")).toBeNull();
  });
  it("/admin/verifikasi tanpa sesi -> /login dengan next", () => {
    const loginUrl = new URL(
      proxy(new NextRequest("http://localhost:3000/admin/verifikasi?s=1")).headers.get("location")!,
    );
    expect(loginUrl.pathname).toBe("/login");
    expect(loginUrl.searchParams.get("next")).toBe("/admin/verifikasi?s=1");
    expect(config.matcher).toContain("/admin/:path*");
  });
  it("matcher mencakup semua rute dashboard", () => {
    for (const route of [
      "dashboard",
      "menu",
      "pesanan",
      "laporan",
      "promo",
      "ulasan",
      "pengaturan",
      "template-wa",
      "copilot",
      "pratinjau",
    ]) {
      expect(config.matcher).toContain(`/${route}/:path*`);
    }
  });
});
