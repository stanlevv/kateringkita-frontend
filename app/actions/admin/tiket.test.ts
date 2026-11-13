import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
import { balasTiket, tutupTiket } from "./tiket";

const KODE = "TK-20261113-7QPX";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 201, data: { code: KODE } });
});

describe("balasTiket", () => {
  it("semua tingkat admin (requireAdmin tanpa tingkat); balasan dipangkas lalu dikirim", async () => {
    expect(await balasTiket(KODE, "  Sudah kami cek, VA Anda lunas.  ")).toEqual({ data: null });
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(adminFetch).toHaveBeenCalledWith(`/tickets/${KODE}/messages`, { method: "POST", body: JSON.stringify({ body: "Sudah kami cek, VA Anda lunas." }) });
  });
  it("requireAdmin menolak -> backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(balasTiket(KODE, "Halo")).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("kosong atau lebih dari 2000 karakter -> galat field body tanpa panggilan", async () => {
    for (const isi of ["", "   ", "x".repeat(2001), undefined as unknown as string]) {
      expect(await balasTiket(KODE, isi)).toEqual({
        error: { code: "VALIDATION_ERROR", message: "Periksa kembali balasan.", fields: { body: ["Pesan 1–2000 karakter."] } },
      });
    }
    expect(await balasTiket(KODE, "x".repeat(2000))).toEqual({ data: null });
    expect(adminFetch).toHaveBeenCalledTimes(1);
  });
  it("kode tidak valid -> galat tanpa panggilan", async () => {
    for (const kode of ["", "../users", "TK 1", "x".repeat(21), 5 as unknown as string]) {
      expect(await balasTiket(kode, "Halo")).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("galat backend diteruskan (validasi dan tiket ditutup)", async () => {
    const validasi = { code: "VALIDATION_ERROR", message: "Data tidak valid.", fields: { body: ["Pesan 1–2000 karakter."] } };
    adminFetch.mockResolvedValueOnce({ ok: false, status: 400, error: validasi });
    expect(await balasTiket(KODE, "Halo")).toEqual({ error: validasi });
    const tutup = { code: "TICKET_CLOSED", message: "Tiket sudah ditutup. Buat tiket baru bila masih perlu bantuan." };
    adminFetch.mockResolvedValueOnce({ ok: false, status: 409, error: tutup });
    expect(await balasTiket(KODE, "Halo")).toEqual({ error: tutup });
  });
});

describe("tutupTiket", () => {
  it("POST /tickets/:code/close tanpa body", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: { code: KODE, status: "closed" } });
    expect(await tutupTiket(KODE)).toEqual({ data: null });
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(adminFetch).toHaveBeenCalledWith(`/tickets/${KODE}/close`, { method: "POST" });
  });
  it("kode tidak valid -> galat tanpa panggilan; galat backend diteruskan", async () => {
    expect(await tutupTiket("a/b")).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan." } });
    expect(await tutupTiket(KODE)).toEqual({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan." } });
  });
});
