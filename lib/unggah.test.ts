import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestUpload = vi.fn();
vi.mock("@/app/actions/menus", () => ({ requestUpload: (...a: unknown[]) => requestUpload(...a) }));
import { unggahFoto } from "./unggah";

const GAGAL = { error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } };
const berkas = new File([new Uint8Array(10)], "f.png", { type: "image/png" });
const fetchMock = vi.fn();

beforeEach(() => {
  requestUpload.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  requestUpload.mockResolvedValue({ data: { upload_url: "https://r2.test/put?sig=1", public_url: "https://cdn.test/a.png", expires_at: "x" } });
  fetchMock.mockResolvedValue({ ok: true, status: 200 });
});
afterEach(() => vi.unstubAllGlobals());

describe("unggahFoto (M-07, M-10, FE-08)", () => {
  it("sukses: minta URL lalu PUT berkas dengan Content-Type; hasil = public_url", async () => {
    expect(await unggahFoto(berkas, "logo")).toEqual({ data: { public_url: "https://cdn.test/a.png" } });
    expect(requestUpload).toHaveBeenCalledWith({ purpose: "logo", content_type: "image/png", size: 10 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://r2.test/put?sig=1");
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ "Content-Type": "image/png" });
    expect(init.body).toBe(berkas);
  });
  it("PUT ditolak (403) -> UPLOAD_FAILED", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    expect(await unggahFoto(berkas, "menu")).toEqual(GAGAL);
  });
  it("jaringan putus saat PUT -> UPLOAD_FAILED, tidak melempar", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await unggahFoto(berkas, "menu")).toEqual(GAGAL);
  });
  it("requestUpload gagal -> galatnya diteruskan, PUT tidak dipanggil", async () => {
    requestUpload.mockResolvedValue({ error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." } });
    expect(await unggahFoto(berkas, "qris")).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("requestUpload melempar -> galat jaringan, tidak melempar", async () => {
    requestUpload.mockRejectedValue(new Error("putus"));
    const r = await unggahFoto(berkas, "menu");
    expect("error" in r).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
