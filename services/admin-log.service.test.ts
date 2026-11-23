import { describe, expect, it } from "vitest";
import { listChanges, actionLabel } from "@/services/admin-log.service";

describe("label log", () => {
  it("memetakan aksi ke label Indonesia, tak dikenal apa adanya", () => {
    expect(actionLabel("merchant.verify")).toBe("Verifikasi penjual");
    expect(actionLabel("master.categories.create")).toBe("Tambah kategori");
    expect(actionLabel("promo.update")).toBe("Ubah promo");
    expect(actionLabel("settings.service_fee")).toBe("Ubah biaya layanan");
    expect(actionLabel("ticket.reply")).toBe("Balas tiket bantuan");
    expect(actionLabel("ticket.close")).toBe("Tutup tiket bantuan");
    expect(actionLabel("x.y")).toBe("x.y");
  });
  it("daftar perubahan: hanya field yang berbeda, lama → baru", () => {
    expect(listChanges({ a: 1, b: "x", c: true }, { a: 2, b: "x", c: false })).toEqual([
      { field: "a", before: "1", after: "2" },
      { field: "c", before: "ya", after: "tidak" },
    ]);
  });
  it("label Indonesia untuk field dan nilai; field tak dikenal memakai nama asli", () => {
    expect(
      listChanges(
        { verification_status: "pending", is_open: 1, is_active: 0, suspended_reason: null, verified_at: null, zzz: 1 },
        {
          verification_status: "suspended",
          is_open: 0,
          is_active: 1,
          suspended_reason: "Menu palsu",
          verified_at: "2026-10-31T03:00:00.000Z",
          zzz: 2,
        },
      ),
    ).toEqual([
      { field: "Status verifikasi", before: "Menunggu", after: "Ditangguhkan" },
      { field: "Status dapur", before: "Buka", after: "Tutup" },
      { field: "Aktif", before: "tidak", after: "ya" },
      { field: "Alasan penangguhan", before: "—", after: "Menu palsu" },
      { field: "Diverifikasi pada", before: "—", after: expect.stringMatching(/31 Okt 2026/) },
      { field: "zzz", before: "1", after: "2" },
    ]);
    expect(
      listChanges({ sort_order: 1, name: "A" }, { sort_order: 2, name: "B" }).map((change) => change.field),
    ).toEqual(["Urutan", "Nama"]);
  });
  it("tanpa before (buat): lama '—'; null dan objek bersarang", () => {
    expect(listChanges(null, { nama: "Soto", x: null })).toEqual([{ field: "nama", before: "—", after: "Soto" }]);
    expect(listChanges({ a: null }, { a: 5 })).toEqual([{ field: "a", before: "—", after: "5" }]);
    expect(listChanges(null, null)).toEqual([]);
  });
});
