// Test layout dashboard: badge dari server, lebar sidebar dari cookie, dan mode pemeliharaan.
// Services dan cookie dipalsukan (vi.mock); layout dipanggil langsung sebagai fungsi lalu hasilnya dibaca sebagai JSON.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth.service", () => ({
  requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: { business_name: "Dapur" } }),
}));
vi.mock("@/services/profile.service", () => ({ getProfile: async () => ({ error: { code: "X", message: "x" } }) }));
vi.mock("@/services/order.service", () => ({ getNeedsActionCount: async () => 7 }));
vi.mock("@/services/notification.service", () => ({ getUnreadNotificationCount: async () => 4 }));
let maintenance = { aktif: false, pesan: null as string | null };
vi.mock("@/services/meta.service", () => ({ getMaintenance: async () => maintenance }));
let sidebarCookie: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "kk-sidebar" && sidebarCookie ? { value: sidebarCookie } : undefined),
  }),
}));
import DashboardLayout from "./layout";

describe("shell dashboard", () => {
  it("penanda data contoh sudah tidak ada (semua services tersambung backend)", async () => {
    const layout = await DashboardLayout({ children: null });
    expect(JSON.stringify(layout)).not.toContain("data contoh");
  });
  it("badge pesanan = jumlah menunggu + terkonfirmasi dari server", async () => {
    const layout = await DashboardLayout({ children: null });
    expect(JSON.stringify(layout)).toContain('"badge":7');
    expect(JSON.stringify(layout)).toContain('"unreadNotifications":4');
  });
  it("lebar sidebar dari cookie kk-sidebar sudah dirender server (tanpa kedip)", async () => {
    sidebarCookie = "ringkas";
    expect(JSON.stringify(await DashboardLayout({ children: null }))).toContain('"mode":"ringkas"');
    sidebarCookie = undefined;
    expect(JSON.stringify(await DashboardLayout({ children: null }))).toContain('"mode":"lebar"');
  });
  it("mode pemeliharaan aktif -> halaman pemberitahuan berisi pesan admin, tanpa shell", async () => {
    maintenance = { aktif: true, pesan: "Sampai 14.00 WIB" };
    const json = JSON.stringify(await DashboardLayout({ children: null }));
    maintenance = { aktif: false, pesan: null };
    expect(json).toContain("Sampai 14.00 WIB");
    expect(json).not.toContain('"badge":7');
  });
});
