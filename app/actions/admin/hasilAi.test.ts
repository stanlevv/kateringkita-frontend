import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
import { verifikasiHasilAi } from "./hasilAi";

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({});
  adminFetch.mockReset().mockResolvedValue({ ok: true, status: 200, data: { id: 5 } });
});

describe("verifikasiHasilAi", () => {
  it("hanya super & ops; setujui dengan catatan opsional yang dipangkas", async () => {
    expect(await verifikasiHasilAi(5, "disetujui", "  Angka sesuai  ")).toEqual({ data: null });
    expect(requireAdmin).toHaveBeenCalledWith("super", "ops");
    expect(adminFetch).toHaveBeenCalledWith("/hasil-ai/5", { method: "PATCH", body: JSON.stringify({ status: "disetujui", catatan: "Angka sesuai" }) });
    await verifikasiHasilAi(6, "disetujui", "   ");
    expect(adminFetch).toHaveBeenLastCalledWith("/hasil-ai/6", { method: "PATCH", body: JSON.stringify({ status: "disetujui" }) });
  });

  it("tolak wajib alasan 3–300 karakter", async () => {
    for (const c of [undefined, "", "ab", "x".repeat(301)]) {
      expect(await verifikasiHasilAi(5, "ditolak", c)).toEqual({
        error: { code: "VALIDATION_ERROR", message: "Periksa kembali catatan.", fields: { catatan: ["Tulis alasan penolakan (3–300 karakter)."] } },
      });
    }
    expect(adminFetch).not.toHaveBeenCalled();
    expect(await verifikasiHasilAi(5, "ditolak", "Menu tidak sesuai")).toEqual({ data: null });
  });

  it("id atau status tidak valid -> galat tanpa panggilan", async () => {
    for (const [id, st] of [[0, "disetujui"], [1.5, "disetujui"], ["5", "disetujui"], [5, "menunggu"], [5, "hapus"]] as const) {
      expect(await verifikasiHasilAi(id as number, st as "disetujui")).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("galat backend diteruskan", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "Hasil AI tidak ditemukan." } });
    expect(await verifikasiHasilAi(9, "disetujui")).toMatchObject({ error: { code: "NOT_FOUND", message: "Hasil AI tidak ditemukan." } });
  });
});
