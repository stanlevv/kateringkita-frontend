import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const call = (query: string) => GET(new NextRequest(`http://localhost:3000/api/skenario?${query}`));

afterEach(() => vi.unstubAllEnvs());

describe("/api/skenario", () => {
  it("memasang cookie dan redirect ke path internal", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await call("nilai=gagal-muat&ke=/dashboard");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    const cookie = response.cookies.get("kk_skenario");
    expect(cookie?.value).toBe("gagal-muat");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.path).toBe("/");
  });
  it("nilai=hapus menghapus cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await call("nilai=hapus&ke=/pratinjau");
    expect(response.cookies.get("kk_skenario")?.value).toBe("");
  });
  it("nilai tak dikenal tidak memasang cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await call("nilai=ngawur");
    expect(response.cookies.get("kk_skenario")).toBeUndefined();
  });
  it("production -> 404 tanpa cookie (Review Focus 1)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await call("nilai=gagal-muat&ke=/dashboard");
    expect(response.status).toBe(404);
    expect(response.cookies.get("kk_skenario")).toBeUndefined();
  });
  it("ke berbahaya -> kembali ke /pratinjau (cegah open redirect)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const target of [
      "//evil.com",
      "https://evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "/\u007f/evil.com",
      "evil.com",
      "",
    ]) {
      const response = await call(`nilai=hapus&ke=${encodeURIComponent(target)}`);
      expect(response.headers.get("location")).toBe("http://localhost:3000/pratinjau");
    }
  });
});
