import { describe, expect, it } from "vitest";
import { daftarPerubahan, labelAksi } from "@/services/adminLogService";

describe("label log", () => {
  it("memetakan aksi ke label Indonesia, tak dikenal apa adanya", () => {
    expect(labelAksi("merchant.verify")).toBe("Verifikasi penjual");
    expect(labelAksi("master.categories.create")).toBe("Tambah kategori");
    expect(labelAksi("promo.update")).toBe("Ubah promo");
    expect(labelAksi("settings.service_fee")).toBe("Ubah biaya layanan");
    expect(labelAksi("ticket.reply")).toBe("Balas tiket bantuan");
    expect(labelAksi("ticket.close")).toBe("Tutup tiket bantuan");
    expect(labelAksi("x.y")).toBe("x.y");
  });
  it("daftar perubahan: hanya field yang berbeda, lama → baru", () => {
    expect(daftarPerubahan({ a: 1, b: "x", c: true }, { a: 2, b: "x", c: false })).toEqual([
      { field: "a", lama: "1", baru: "2" },
      { field: "c", lama: "ya", baru: "tidak" },
    ]);
  });
  it("label Indonesia untuk field dan nilai; field tak dikenal memakai nama asli", () => {
    expect(daftarPerubahan(
      { verification_status: "pending", is_open: 1, is_active: 0, suspended_reason: null, verified_at: null, zzz: 1 },
      { verification_status: "suspended", is_open: 0, is_active: 1, suspended_reason: "Menu palsu", verified_at: "2026-10-31T03:00:00.000Z", zzz: 2 },
    )).toEqual([
      { field: "Status verifikasi", lama: "Menunggu", baru: "Ditangguhkan" },
      { field: "Status dapur", lama: "Buka", baru: "Tutup" },
      { field: "Aktif", lama: "tidak", baru: "ya" },
      { field: "Alasan penangguhan", lama: "—", baru: "Menu palsu" },
      { field: "Diverifikasi pada", lama: "—", baru: expect.stringMatching(/31 Okt 2026/) },
      { field: "zzz", lama: "1", baru: "2" },
    ]);
    expect(daftarPerubahan({ sort_order: 1, name: "A" }, { sort_order: 2, name: "B" }).map((p) => p.field)).toEqual(["Urutan", "Nama"]);
  });
  it("tanpa before (buat): lama '—'; null dan objek bersarang", () => {
    expect(daftarPerubahan(null, { nama: "Soto", x: null })).toEqual([{ field: "nama", lama: "—", baru: "Soto" }]);
    expect(daftarPerubahan({ a: null }, { a: 5 })).toEqual([{ field: "a", lama: "—", baru: "5" }]);
    expect(daftarPerubahan(null, null)).toEqual([]);
  });
});
