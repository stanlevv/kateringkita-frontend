import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const call = (qs: string) => GET(new NextRequest(`http://localhost:3000/api/skenario?${qs}`));

afterEach(() => vi.unstubAllEnvs());

describe("/api/skenario", () => {
  it("memasang cookie dan redirect ke path internal", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await call("nilai=gagal-muat&ke=/dashboard");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
    const c = res.cookies.get("kk_skenario");
    expect(c?.value).toBe("gagal-muat");
    expect(c?.httpOnly).toBe(true);
    expect(c?.sameSite).toBe("lax");
    expect(c?.path).toBe("/");
  });
  it("nilai=hapus menghapus cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await call("nilai=hapus&ke=/pratinjau");
    expect(res.cookies.get("kk_skenario")?.value).toBe("");
  });
  it("nilai tak dikenal tidak memasang cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await call("nilai=ngawur");
    expect(res.cookies.get("kk_skenario")).toBeUndefined();
  });
  it("production -> 404 tanpa cookie (Review Focus 1)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await call("nilai=gagal-muat&ke=/dashboard");
    expect(res.status).toBe(404);
    expect(res.cookies.get("kk_skenario")).toBeUndefined();
  });
  it("ke berbahaya -> kembali ke /pratinjau (cegah open redirect)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const x of ["//evil.com", "https://evil.com", "/\\evil.com", "/\t/evil.com", "/\u007f/evil.com", "evil.com", ""]) {
      const res = await call(`nilai=hapus&ke=${encodeURIComponent(x)}`);
      expect(res.headers.get("location")).toBe("http://localhost:3000/pratinjau");
    }
  });
});
