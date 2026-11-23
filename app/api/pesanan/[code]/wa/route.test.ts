// Test route handler /api/pesanan/[code]/wa: wajib sesi penjual, kode pesanan di-encode, hanya tautan https://wa.me/
// yang diikuti, dan galat atau tautan lain kembali ke detail pesanan dengan ?wa=gagal. redirect dan services dipalsukan.
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  merchantFetch: (...args: unknown[]) => merchantFetch(...args),
}));
import { GET } from "./route";

const openRoute = (code: string) =>
  GET(new Request(`http://localhost/api/pesanan/${code}/wa`), { params: Promise.resolve({ code }) });
const redirectTarget = async (code: string) =>
  (
    await openRoute(code).then(
      () => new Error("tanpa redirect"),
      (error: Error) => error,
    )
  ).message.replace("REDIRECT:", "");

beforeEach(() => {
  redirect.mockClear();
  requireMerchant.mockClear();
  merchantFetch.mockReset();
});

describe("M-04, M-11 Chat WA penjual", () => {
  it("wajib sesi penjual, memanggil endpoint WA dengan kode ter-encode", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { url: "https://wa.me/62812?text=Halo" } });
    await redirectTarget("KK/1");
    expect(requireMerchant).toHaveBeenCalledOnce();
    expect(merchantFetch).toHaveBeenCalledWith("/orders/KK%2F1/whatsapp");
  });
  it("url wa.me -> redirect ke url itu", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { url: "https://wa.me/62812?text=Halo" } });
    expect(await redirectTarget("KK-1")).toBe("https://wa.me/62812?text=Halo");
  });
  it("galat backend -> kembali ke detail pesanan", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "x" } });
    expect(await redirectTarget("KK-1")).toBe("/pesanan/KK-1?wa=gagal");
  });
  it.each([
    "https://jahat.test/",
    "http://wa.me/62812",
    "https://wa.me.jahat.test/x",
    "javascript:alert(1)",
    "//jahat.test",
  ])("url %s ditolak -> detail pesanan", async (url) => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { url } });
    expect(await redirectTarget("KK-1")).toBe("/pesanan/KK-1?wa=gagal");
  });
});
