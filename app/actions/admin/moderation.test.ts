// Test server action moderasi (app/actions/admin/moderation.ts): sembunyikan/turunkan dengan alasan dan hapus foto menu.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireAdmin: () => requireAdmin() }));
const adminFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { deleteMenuPhoto, moderate } from "./moderation";

beforeEach(() => {
  adminFetch.mockReset();
  requireAdmin.mockClear();
  adminFetch.mockResolvedValue({ ok: true, status: 200, data: { id: 1 } });
});

describe("F19 moderasi", () => {
  it("hide/takedown wajib alasan; dikirim ke rute yang benar", async () => {
    expect(await moderate(3, "hide", "  Spam  ")).toEqual({ data: { id: 1 } });
    expect(adminFetch).toHaveBeenCalledWith("/reviews/3/hide", {
      method: "POST",
      body: JSON.stringify({ reason: "Spam" }),
    });
    await moderate(4, "takedown", "Foto");
    expect(adminFetch).toHaveBeenLastCalledWith("/menus/4/takedown", {
      method: "POST",
      body: JSON.stringify({ reason: "Foto" }),
    });
    expect(requireAdmin).toHaveBeenCalled();
  });
  it("unhide/restore tanpa body", async () => {
    await moderate(3, "unhide");
    expect(adminFetch).toHaveBeenLastCalledWith("/reviews/3/unhide", { method: "POST", body: undefined });
    await moderate(4, "restore");
    expect(adminFetch).toHaveBeenLastCalledWith("/menus/4/restore", { method: "POST", body: undefined });
  });
  it("alasan kosong / id atau aksi tak valid -> galat tanpa API", async () => {
    expect(await moderate(3, "hide", " ")).toMatchObject({
      error: { code: "VALIDATION_ERROR", fields: { reason: expect.any(Array) } },
    });
    expect(await moderate(0, "unhide")).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(await moderate(1, "hapus" as never)).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("hapusFotoMenu: url + alasan ke rute foto; alasan kosong / id / url tak valid -> galat tanpa API", async () => {
    await deleteMenuPhoto(4, "https://foto.test/a.jpg", "  Bukan makanan ");
    expect(adminFetch).toHaveBeenLastCalledWith("/menus/4/photos/remove", {
      method: "POST",
      body: JSON.stringify({ url: "https://foto.test/a.jpg", reason: "Bukan makanan" }),
    });
    adminFetch.mockClear();
    expect("error" in (await deleteMenuPhoto(4, "https://foto.test/a.jpg", "  "))).toBe(true);
    expect("error" in (await deleteMenuPhoto(0, "https://foto.test/a.jpg", "x"))).toBe(true);
    expect("error" in (await deleteMenuPhoto(4, "", "x"))).toBe(true);
    expect(adminFetch).not.toHaveBeenCalled();
  });
});
