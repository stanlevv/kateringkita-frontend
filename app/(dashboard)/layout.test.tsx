import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: { business_name: "Dapur" } }) }));
vi.mock("@/lib/data/profile", () => ({ getProfile: async () => ({ error: { code: "X", message: "x" } }) }));
vi.mock("@/lib/data/orders", () => ({ getJumlahTindakan: async () => 7 }));
import DashboardLayout from "./layout";

describe("shell dashboard", () => {
  it("selalu menampilkan penanda data contoh", async () => {
    const el = await DashboardLayout({ children: null });
    expect(JSON.stringify(el)).toContain("Sebagian halaman masih memakai data contoh.");
  });
  it("badge pesanan = jumlah menunggu + terkonfirmasi dari server (M-04)", async () => {
    const el = await DashboardLayout({ children: null });
    expect(JSON.stringify(el)).toContain('"badge":7');
  });
});
