import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/authService", () => ({ requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: { business_name: "Dapur" } }) }));
vi.mock("@/services/profileService", () => ({ getProfile: async () => ({ error: { code: "X", message: "x" } }) }));
vi.mock("@/services/orderService", () => ({ getJumlahTindakan: async () => 7 }));
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
  });
  it("SH-N1: lebar sidebar dari cookie kk-sidebar sudah dirender server (tanpa kedip)", async () => {
    kuki = "ringkas";
    expect(JSON.stringify(await DashboardLayout({ children: null }))).toContain('"mode":"ringkas"');
    kuki = undefined;
    expect(JSON.stringify(await DashboardLayout({ children: null }))).toContain('"mode":"lebar"');
  });
});
