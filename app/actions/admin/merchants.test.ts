import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (asli) => ({ ...(await asli<object>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
import { aksiPenjual } from "./merchants";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: {} });
});

describe("aksiPenjual (A-05)", () => {
  it("memanggil requireAdmin lebih dulu; jika menolak, backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("404"));
    await expect(aksiPenjual(1, "verify")).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("id tidak valid atau aksi tak dikenal -> VALIDATION_ERROR tanpa panggilan", async () => {
    for (const [id, a] of [[0, "verify"], [-1, "verify"], [1.5, "verify"], [1, "hapus"], [1, "toString"]] as const) {
      const r = await aksiPenjual(id, a as never);
      expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("alasan wajib 1–500 untuk minta perbaikan & tangguhkan; dipangkas", async () => {
    for (const alasan of [undefined, "", "   ", "x".repeat(501)]) {
      const r = await aksiPenjual(3, "suspend", alasan);
      expect("error" in r && r.error.fields?.reason).toBeTruthy();
    }
    expect(adminFetch).not.toHaveBeenCalled();
    await aksiPenjual(3, "request-fix", "  Foto buram  ");
    expect(adminFetch).toHaveBeenCalledWith("/merchants/3/request-fix", { method: "POST", body: JSON.stringify({ reason: "Foto buram" }) });
  });
  it("verifikasi tanpa alasan dan tanpa body", async () => {
    const r = await aksiPenjual(3, "verify", "diabaikan");
    expect(r).toEqual({ data: null });
    expect(adminFetch).toHaveBeenCalledWith("/merchants/3/verify", { method: "POST", body: undefined });
  });
  it("galat backend (409) diteruskan", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message: "Status penjual sudah berubah." } });
    const r = await aksiPenjual(3, "verify");
    expect("error" in r && r.error.code).toBe("CONFLICT");
  });
});
