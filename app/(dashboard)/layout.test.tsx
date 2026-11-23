import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/authService", () => ({ requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: { business_name: "Dapur" } }) }));
vi.mock("@/services/profileService", () => ({ getProfile: async () => ({ error: { code: "X", message: "x" } }) }));
vi.mock("@/services/orderService", () => ({ getJumlahTindakan: async () => 7 }));
vi.mock("@/services/notifikasiService", () => ({ getJumlahNotif: async () => 4 }));
let pemeliharaan = { aktif: false, pesan: null as string | null };
vi.mock("@/services/metaService", () => ({ getPemeliharaan: async () => pemeliharaan }));
let kuki: string | undefined;
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (k: string) => (k === "kk-sidebar" && kuki ? { value: kuki } : undefined) }) }));
import DashboardLayout from "./layout";

describe("shell dashboard", () => {
  it("F13: penanda data contoh sudah tidak ada (semua services tersambung backend)", async () => {
    const el = await DashboardLayout({ children: null });
    expect(JSON.stringify(el)).not.toContain("data contoh");
  });
  it("badge pesanan = jumlah menunggu + terkonfirmasi dari server (M-04)", async () => {
    const el = await DashboardLayout({ children: null });
    expect(JSON.stringify(el)).toContain('"badge":7');
    expect(JSON.stringify(el)).toContain('"notif":4');
  });
  it("SH-N1: lebar sidebar dari cookie kk-sidebar sudah dirender server (tanpa kedip)", async () => {
    kuki = "ringkas";
    expect(JSON.stringify(await DashboardLayout({ children: null }))).toContain('"mode":"ringkas"');
    kuki = undefined;
    expect(JSON.stringify(await DashboardLayout({ children: null }))).toContain('"mode":"lebar"');
  });
  it("F27: mode pemeliharaan aktif -> halaman pemberitahuan berisi pesan admin, tanpa shell", async () => {
    pemeliharaan = { aktif: true, pesan: "Sampai 14.00 WIB" };
    const teks = JSON.stringify(await DashboardLayout({ children: null }));
    pemeliharaan = { aktif: false, pesan: null };
    expect(teks).toContain("Sampai 14.00 WIB");
    expect(teks).not.toContain('"badge":7');
  });
});
