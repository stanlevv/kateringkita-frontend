// Test server action pengumuman (announcements.ts), serta kontak CS dan mode pemeliharaan (promos.ts) di app/actions/admin.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireAdmin: () => requireAdmin() }));
const adminFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  adminFetch: (...args: unknown[]) => adminFetch(...args),
}));
import { sendAnnouncement } from "./announcements";
import { saveCustomerServiceContact, saveMaintenance } from "./promos";

beforeEach(() => {
  adminFetch.mockReset();
  requireAdmin.mockClear();
});

describe("sendAnnouncement", () => {
  it("POST /admin/broadcasts dengan teks dirapikan", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 201, data: { sent: 3 } });
    expect(await sendAnnouncement({ audience: "all", title: " Libur ", body: " Tutup besok " })).toEqual({
      data: { sent: 3 },
    });
    expect(adminFetch).toHaveBeenCalledWith("/broadcasts", {
      method: "POST",
      body: JSON.stringify({ audience: "all", title: "Libur", body: "Tutup besok" }),
    });
    expect(requireAdmin).toHaveBeenCalled();
  });
  it("penerima/judul/isi tidak valid -> galat tanpa API", async () => {
    expect(await sendAnnouncement({ audience: "semua" as never, title: "a", body: "b" })).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(await sendAnnouncement({ audience: "customer", title: "", body: "x".repeat(256) })).toMatchObject({
      error: { fields: { title: expect.any(Array), body: expect.any(Array) } },
    });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("saveCustomerServiceContact", () => {
  it("PUT /admin/settings/cs-contact; kosong boleh; nomor salah ditolak", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: { cs_whatsapp: "085852157352" } });
    expect(await saveCustomerServiceContact(" 085852157352 ")).toEqual({ data: { cs_whatsapp: "085852157352" } });
    expect(adminFetch).toHaveBeenCalledWith("/settings/cs-contact", {
      method: "PUT",
      body: JSON.stringify({ wa_number: "085852157352" }),
    });
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: { cs_whatsapp: null } });
    expect(await saveCustomerServiceContact("")).toEqual({ data: { cs_whatsapp: null } });
    adminFetch.mockClear();
    expect(await saveCustomerServiceContact("12345")).toMatchObject({
      error: { fields: { wa_number: expect.any(Array) } },
    });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});

describe("saveMaintenance", () => {
  it("PUT /admin/settings/maintenance dengan pesan dirapikan; pesan >200 ditolak tanpa API", async () => {
    adminFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: { maintenance: { aktif: true, pesan: "Sampai 14.00" } },
    });
    expect(await saveMaintenance(true, " Sampai 14.00 ")).toEqual({
      data: { maintenance: { aktif: true, pesan: "Sampai 14.00" } },
    });
    expect(adminFetch).toHaveBeenCalledWith("/settings/maintenance", {
      method: "PUT",
      body: JSON.stringify({ aktif: true, pesan: "Sampai 14.00" }),
    });
    expect(requireAdmin).toHaveBeenCalled();
    adminFetch.mockReset();
    expect(await saveMaintenance(true, "x".repeat(201))).toMatchObject({
      error: { fields: { pesan: expect.any(Array) } },
    });
    expect(adminFetch).not.toHaveBeenCalled();
  });
});
