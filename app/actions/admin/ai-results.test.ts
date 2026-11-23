import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireAdmin: (...args: unknown[]) => requireAdmin(...args) }));
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { verifyAiResult } from "./ai-results";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: { id: 5 } });
});

describe("verifikasiHasilAi", () => {
  it("hanya super & ops; setujui dengan catatan opsional yang dipangkas", async () => {
    expect(await verifyAiResult(5, "disetujui", "  Angka sesuai  ")).toEqual({ data: null });
    expect(requireAdmin).toHaveBeenCalledWith("super", "ops");
    expect(adminFetch).toHaveBeenCalledWith("/hasil-ai/5", {
      method: "PATCH",
      body: JSON.stringify({ status: "disetujui", catatan: "Angka sesuai" }),
    });
    await verifyAiResult(6, "disetujui", "   ");
    expect(adminFetch).toHaveBeenLastCalledWith("/hasil-ai/6", {
      method: "PATCH",
      body: JSON.stringify({ status: "disetujui" }),
    });
  });

  it("tolak wajib alasan 3–300 karakter", async () => {
    for (const note of [undefined, "", "ab", "x".repeat(301)]) {
      expect(await verifyAiResult(5, "ditolak", note)).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Periksa kembali catatan.",
          fields: { catatan: ["Tulis alasan penolakan (3–300 karakter)."] },
        },
      });
    }
    expect(adminFetch).not.toHaveBeenCalled();
    expect(await verifyAiResult(5, "ditolak", "Menu tidak sesuai")).toEqual({ data: null });
  });

  it("id atau status tidak valid -> galat tanpa panggilan", async () => {
    for (const [id, status] of [
      [0, "disetujui"],
      [1.5, "disetujui"],
      ["5", "disetujui"],
      [5, "menunggu"],
      [5, "hapus"],
    ] as const) {
      expect(await verifyAiResult(id as number, status as "disetujui")).toMatchObject({
        error: { code: "VALIDATION_ERROR" },
      });
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("galat backend diteruskan", async () => {
    adminFetch.mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: "NOT_FOUND", message: "Hasil AI tidak ditemukan." },
    });
    expect(await verifyAiResult(9, "disetujui")).toMatchObject({
      error: { code: "NOT_FOUND", message: "Hasil AI tidak ditemukan." },
    });
  });
});
