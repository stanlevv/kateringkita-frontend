import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
const adminFetch = vi.fn();
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
import { kirimPengumuman } from "./pengumuman";
import { simpanKontakCs } from "./promos";

beforeEach(() => { adminFetch.mockReset(); requireAdmin.mockClear(); });

describe("kirimPengumuman", () => {
  it("POST /admin/broadcasts dengan teks dirapikan", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 201, data: { sent: 3 } });
    expect(await kirimPengumuman({ audience: "all", title: " Libur ", body: " Tutup besok " })).toEqual({ data: { sent: 3 } });
    expect(adminFetch).toHaveBeenCalledWith("/broadcasts", { method: "POST", body: JSON.stringify({ audience: "all", title: "Libur", body: "Tutup besok" }) });
    expect(requireAdmin).toHaveBeenCalled();
  });
  it("penerima/judul/isi tidak valid -> galat tanpa API", async () => {
    expect(await kirimPengumuman({ audience: "semua" as never, title: "a", body: "b" })).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(await kirimPengumuman({ audience: "customer", title: "", body: "x".repeat(256) })).toMatchObject({ error: { fields: { title: expect.any(Array), body: expect.any(Array) } } });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("simpanKontakCs", () => {
  it("PUT /admin/settings/cs-contact; kosong boleh; nomor salah ditolak", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: { cs_whatsapp: "085852157352" } });
    expect(await simpanKontakCs(" 085852157352 ")).toEqual({ data: { cs_whatsapp: "085852157352" } });
    expect(adminFetch).toHaveBeenCalledWith("/settings/cs-contact", { method: "PUT", body: JSON.stringify({ wa_number: "085852157352" }) });
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: { cs_whatsapp: null } });
    expect(await simpanKontakCs("")).toEqual({ data: { cs_whatsapp: null } });
    adminFetch.mockClear();
    expect(await simpanKontakCs("12345")).toMatchObject({ error: { fields: { wa_number: expect.any(Array) } } });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});
