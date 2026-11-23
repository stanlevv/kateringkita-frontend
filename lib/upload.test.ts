import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestUpload = vi.fn();
vi.mock("@/app/actions/menus", () => ({ requestUpload: (...args: unknown[]) => requestUpload(...args) }));
import { uploadPhoto } from "./upload";

const UPLOAD_FAILED = { error: { code: "UPLOAD_FAILED", message: "Foto gagal diunggah. Coba lagi" } };
const photo = new File([new Uint8Array(10)], "f.png", { type: "image/png" });
const fetchMock = vi.fn();

beforeEach(() => {
  requestUpload.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  requestUpload.mockResolvedValue({
    data: { upload_url: "https://r2.test/put?sig=1", public_url: "https://cdn.test/a.png", expires_at: "x" },
  });
  fetchMock.mockResolvedValue({ ok: true, status: 200 });
});
afterEach(() => vi.unstubAllGlobals());

describe("unggahFoto (M-07, M-10, FE-08)", () => {
  it("sukses: minta URL lalu PUT berkas dengan Content-Type; hasil = public_url", async () => {
    expect(await uploadPhoto(photo, "logo")).toEqual({ data: { public_url: "https://cdn.test/a.png" } });
    expect(requestUpload).toHaveBeenCalledWith({ purpose: "logo", content_type: "image/png", size: 10 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://r2.test/put?sig=1");
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ "Content-Type": "image/png" });
    expect(init.body).toBe(photo);
  });
  it("PUT ditolak (403) -> UPLOAD_FAILED", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    expect(await uploadPhoto(photo, "menu")).toEqual(UPLOAD_FAILED);
  });
  it("jaringan putus saat PUT -> UPLOAD_FAILED, tidak melempar", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await uploadPhoto(photo, "menu")).toEqual(UPLOAD_FAILED);
  });
  it("requestUpload gagal -> galatnya diteruskan, PUT tidak dipanggil", async () => {
    requestUpload.mockResolvedValue({
      error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." },
    });
    expect(await uploadPhoto(photo, "logo")).toEqual({
      error: { code: "SERVICE_UNAVAILABLE", message: "Unggah foto belum tersedia. Coba lagi nanti." },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("requestUpload melempar -> galat jaringan, tidak melempar", async () => {
    requestUpload.mockRejectedValue(new Error("putus"));
    const result = await uploadPhoto(photo, "menu");
    expect("error" in result).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("unggahFoto memperkecil foto sebelum unggah", () => {
  const ONE_MB = 1024 * 1024;
  const phonePhoto = () => new File([new Uint8Array(8 * ONE_MB)], "IMG_0001.jpg", { type: "image/jpeg" });
  const context = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() };
  const originalImage = {
    buat: URL.createObjectURL,
    hapus: URL.revokeObjectURL,
    decode: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "decode"),
  };
  let originalSize = { w: 4000, h: 3000 };
  let webp = true; // false = browser tanpa penyandi WebP (Safari) memberi PNG
  let decode: () => Promise<void>;
  const kanvas: { w: number; h: number }[] = [];

  beforeEach(() => {
    originalSize = { w: 4000, h: 3000 };
    webp = true;
    decode = () => Promise.resolve();
    kanvas.length = 0;
    context.fillRect.mockReset();
    context.drawImage.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:foto");
    URL.revokeObjectURL = vi.fn();
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      writable: true,
      value: () => decode(),
    });
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockImplementation(() => originalSize.w);
    vi.spyOn(HTMLImageElement.prototype, "naturalHeight", "get").mockImplementation(() => originalSize.h);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context as never);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      type,
    ) {
      kanvas.push({ w: this.width, h: this.height });
      callback(new Blob([new Uint8Array(1234)], { type: type === "image/webp" && !webp ? "image/png" : type }));
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalImage.buat;
    URL.revokeObjectURL = originalImage.hapus;
    if (originalImage.decode) Object.defineProperty(HTMLImageElement.prototype, "decode", originalImage.decode);
    else delete (HTMLImageElement.prototype as { decode?: unknown }).decode;
  });

  it("foto HP 8 MB 4000x3000 -> WebP 1600x1200 berlatar putih; ukuran & tipe hasil yang diminta dan di-PUT", async () => {
    expect(await uploadPhoto(phonePhoto(), "menu")).toEqual({ data: { public_url: "https://cdn.test/a.png" } });
    expect(kanvas).toEqual([{ w: 1600, h: 1200 }]);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 1600, 1200);
    expect(context.drawImage).toHaveBeenCalledWith(expect.any(HTMLImageElement), 0, 0, 1600, 1200);
    expect(requestUpload).toHaveBeenCalledWith({ purpose: "menu", content_type: "image/webp", size: 1234 });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ "Content-Type": "image/webp" });
    expect(init.body).toBeInstanceOf(Blob);
    expect(init.body.size).toBe(1234);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:foto");
  });

  it("foto kecil tidak diperbesar", async () => {
    originalSize = { w: 800, h: 600 };
    await uploadPhoto(phonePhoto(), "menu");
    expect(kanvas).toEqual([{ w: 800, h: 600 }]);
  });

  it("browser tanpa WebP: foto menu -> JPEG, logo -> PNG 512 px tanpa latar (transparan tetap)", async () => {
    webp = false;
    await uploadPhoto(phonePhoto(), "menu");
    expect(requestUpload).toHaveBeenLastCalledWith(expect.objectContaining({ content_type: "image/jpeg" }));
    context.fillRect.mockReset();
    originalSize = { w: 1024, h: 2048 };
    await uploadPhoto(new File([new Uint8Array(10)], "logo.png", { type: "image/png" }), "logo");
    expect(requestUpload).toHaveBeenLastCalledWith({ purpose: "logo", content_type: "image/png", size: 1234 });
    expect(kanvas.at(-1)).toEqual({ w: 256, h: 512 });
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it("browser gagal membaca foto -> berkas asli; asli > 5 MB -> pesan ukuran tanpa minta URL", async () => {
    decode = () => Promise.reject(new Error("EncodingError"));
    expect(await uploadPhoto(phonePhoto(), "menu")).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Ukuran foto maksimal 5 MB." },
    });
    expect(requestUpload).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:foto");
    await uploadPhoto(photo, "logo");
    expect(requestUpload).toHaveBeenCalledWith({ purpose: "logo", content_type: "image/png", size: 10 });
    expect(fetchMock.mock.calls[0][1].body).toBe(photo);
  });
});
