import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); });
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/lib/session", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/lib/merchant-api", () => ({ merchantFetch: (...a: unknown[]) => merchantFetch(...a) }));
import { GET } from "./route";

const buka = (code: string) => GET(new Request(`http://localhost/pesanan/${code}/wa`), { params: Promise.resolve({ code }) });
const tujuan = async (code: string) => (await buka(code).then(() => new Error("tanpa redirect"), (e: Error) => e)).message.replace("REDIRECT:", "");

beforeEach(() => { redirect.mockClear(); requireMerchant.mockClear(); merchantFetch.mockReset(); });

describe("M-04, M-11 Chat WA penjual", () => {
  it("wajib sesi penjual, memanggil endpoint WA dengan kode ter-encode", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { url: "https://wa.me/62812?text=Halo" } });
    await tujuan("KK/1");
    expect(requireMerchant).toHaveBeenCalledOnce();
    expect(merchantFetch).toHaveBeenCalledWith("/orders/KK%2F1/whatsapp");
  });
  it("url wa.me -> redirect ke url itu", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { url: "https://wa.me/62812?text=Halo" } });
    expect(await tujuan("KK-1")).toBe("https://wa.me/62812?text=Halo");
  });
  it("galat backend -> kembali ke detail pesanan", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "x" } });
    expect(await tujuan("KK-1")).toBe("/pesanan/KK-1?wa=gagal");
  });
  it.each(["https://jahat.test/", "http://wa.me/62812", "https://wa.me.jahat.test/x", "javascript:alert(1)", "//jahat.test"])("url %s ditolak -> detail pesanan", async (url) => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: { url } });
    expect(await tujuan("KK-1")).toBe("/pesanan/KK-1?wa=gagal");
  });
});
