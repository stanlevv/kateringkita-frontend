// Test server action applyMerchantAction (app/actions/admin/merchants.ts): aksi status penjual dan alasan wajib.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { applyMerchantAction } from "./merchants";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: {} });
});

describe("applyMerchantAction", () => {
  it("memanggil requireAdmin lebih dulu; jika menolak, backend tidak dipanggil", async () => {
    requireAdmin.mockRejectedValue(new Error("404"));
    await expect(applyMerchantAction(1, "verify")).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("id tidak valid atau aksi tak dikenal -> VALIDATION_ERROR tanpa panggilan", async () => {
    for (const [id, action] of [
      [0, "verify"],
      [-1, "verify"],
      [1.5, "verify"],
      [1, "hapus"],
      [1, "toString"],
    ] as const) {
      const result = await applyMerchantAction(id, action as never);
      expect("error" in result && result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("alasan wajib 1–500 untuk minta perbaikan & tangguhkan; dipangkas", async () => {
    for (const reason of [undefined, "", "   ", "x".repeat(501)]) {
      const result = await applyMerchantAction(3, "suspend", reason);
      expect("error" in result && result.error.fields?.reason).toBeTruthy();
    }
    expect(adminFetch).not.toHaveBeenCalled();
    await applyMerchantAction(3, "request-fix", "  Foto buram  ");
    expect(adminFetch).toHaveBeenCalledWith("/merchants/3/request-fix", {
      method: "POST",
      body: JSON.stringify({ reason: "Foto buram" }),
    });
  });
  it("verifikasi tanpa alasan dan tanpa body", async () => {
    const result = await applyMerchantAction(3, "verify", "diabaikan");
    expect(result).toEqual({ data: null });
    expect(adminFetch).toHaveBeenCalledWith("/merchants/3/verify", { method: "POST", body: undefined });
  });
  it("galat backend (409) diteruskan", async () => {
    adminFetch.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "Status penjual sudah berubah." },
    });
    const result = await applyMerchantAction(3, "verify");
    expect("error" in result && result.error.code).toBe("CONFLICT");
  });
});
