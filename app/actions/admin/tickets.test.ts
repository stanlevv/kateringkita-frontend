import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: (...args: unknown[]) => requireAdmin(...args) }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { replyToTicket, closeTicket } from "./tickets";

const TICKET_CODE = "TK-20261113-7QPX";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 201, data: { code: TICKET_CODE } });
});

describe("balasTiket", () => {
  it("semua tingkat admin (requireAdmin tanpa tingkat); balasan dipangkas lalu dikirim", async () => {
    expect(await replyToTicket(TICKET_CODE, "  Sudah kami cek, VA Anda lunas.  ")).toEqual({ data: null });
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(adminFetch).toHaveBeenCalledWith(`/tickets/${TICKET_CODE}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: "Sudah kami cek, VA Anda lunas." }),
    });
  });
  it("requireAdmin menolak -> backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    await expect(replyToTicket(TICKET_CODE, "Halo")).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("kosong atau lebih dari 2000 karakter -> galat field body tanpa panggilan", async () => {
    for (const body of ["", "   ", "x".repeat(2001), undefined as unknown as string]) {
      expect(await replyToTicket(TICKET_CODE, body)).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Periksa kembali balasan.",
          fields: { body: ["Pesan 1–2000 karakter."] },
        },
      });
    }
    expect(await replyToTicket(TICKET_CODE, "x".repeat(2000))).toEqual({ data: null });
    expect(adminFetch).toHaveBeenCalledTimes(1);
  });
  it("kode tidak valid -> galat tanpa panggilan", async () => {
    for (const code of ["", "../users", "TK 1", "x".repeat(21), 5 as unknown as string]) {
      expect(await replyToTicket(code, "Halo")).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("galat backend diteruskan (validasi dan tiket ditutup)", async () => {
    const validationError = {
      code: "VALIDATION_ERROR",
      message: "Data tidak valid.",
      fields: { body: ["Pesan 1–2000 karakter."] },
    };
    adminFetch.mockResolvedValueOnce({ ok: false, status: 400, error: validationError });
    expect(await replyToTicket(TICKET_CODE, "Halo")).toEqual({ error: validationError });
    const closedError = {
      code: "TICKET_CLOSED",
      message: "Tiket sudah ditutup. Buat tiket baru bila masih perlu bantuan.",
    };
    adminFetch.mockResolvedValueOnce({ ok: false, status: 409, error: closedError });
    expect(await replyToTicket(TICKET_CODE, "Halo")).toEqual({ error: closedError });
  });
});

describe("tutupTiket", () => {
  it("POST /tickets/:code/close tanpa body", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: { code: TICKET_CODE, status: "closed" } });
    expect(await closeTicket(TICKET_CODE)).toEqual({ data: null });
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(adminFetch).toHaveBeenCalledWith(`/tickets/${TICKET_CODE}/close`, { method: "POST" });
  });
  it("kode tidak valid -> galat tanpa panggilan; galat backend diteruskan", async () => {
    expect(await closeTicket("a/b")).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan." },
    });
    expect(await closeTicket(TICKET_CODE)).toEqual({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan." } });
  });
});
