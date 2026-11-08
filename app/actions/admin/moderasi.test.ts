import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
const adminFetch = vi.fn();
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
import { moderasi } from "./moderasi";

beforeEach(() => { adminFetch.mockReset(); requireAdmin.mockClear(); adminFetch.mockResolvedValue({ ok: true, status: 200, data: { id: 1 } }); });

describe("F19 moderasi", () => {
  it("hide/takedown wajib alasan; dikirim ke rute yang benar", async () => {
    expect(await moderasi(3, "hide", "  Spam  ")).toEqual({ data: { id: 1 } });
    expect(adminFetch).toHaveBeenCalledWith("/reviews/3/hide", { method: "POST", body: JSON.stringify({ reason: "Spam" }) });
    await moderasi(4, "takedown", "Foto");
    expect(adminFetch).toHaveBeenLastCalledWith("/menus/4/takedown", { method: "POST", body: JSON.stringify({ reason: "Foto" }) });
    expect(requireAdmin).toHaveBeenCalled();
  });
  it("unhide/restore tanpa body", async () => {
    await moderasi(3, "unhide");
    expect(adminFetch).toHaveBeenLastCalledWith("/reviews/3/unhide", { method: "POST", body: undefined });
    await moderasi(4, "restore");
    expect(adminFetch).toHaveBeenLastCalledWith("/menus/4/restore", { method: "POST", body: undefined });
  });
  it("alasan kosong / id atau aksi tak valid -> galat tanpa API", async () => {
    expect(await moderasi(3, "hide", " ")).toMatchObject({ error: { code: "VALIDATION_ERROR", fields: { reason: expect.any(Array) } } });
    expect(await moderasi(0, "unhide")).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(await moderasi(1, "hapus" as never)).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});
