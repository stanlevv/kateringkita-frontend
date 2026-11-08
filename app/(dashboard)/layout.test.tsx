import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/authService", () => ({ requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: { business_name: "Dapur" } }) }));
vi.mock("@/services/profileService", () => ({ getProfile: async () => ({ error: { code: "X", message: "x" } }) }));
vi.mock("@/services/orderService", () => ({ getJumlahTindakan: async () => 7 }));
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
});
