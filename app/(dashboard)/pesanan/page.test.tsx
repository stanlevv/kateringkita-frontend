import { describe, expect, it, vi } from "vitest";

const getOrders = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireMerchant: async () => ({ user: {}, merchant: null }) }));
vi.mock("@/services/order.service", () => ({ getOrders: (...args: unknown[]) => getOrders(...args) }));
vi.mock("@/app/(dashboard)/pesanan/components/OrderTable", () => ({ OrderTable: () => null }));
import { todayWib } from "@/lib/format";
import OrdersPage from "./page";

const openPage = async (query: Record<string, string | string[] | undefined>) => {
  getOrders.mockResolvedValue({ data: { rows: [], total: 41 } });
  return OrdersPage({ searchParams: Promise.resolve(query) });
};

describe("PS-N1 halaman daftar pesanan", () => {
  it("searchParams diteruskan ke getOrders", async () => {
    await openPage({ status: "ready", tanggal: "2026-11-01", q: " rina ", page: "2" });
    expect(getOrders).toHaveBeenLastCalledWith({ status: "ready", date: "2026-11-01", q: "rina", page: 2 });
  });
  it("tanpa parameter: hari ini WIB, halaman 1; nilai tak sah diabaikan", async () => {
    await openPage({});
    expect(getOrders).toHaveBeenLastCalledWith({ status: undefined, date: todayWib(), q: undefined, page: 1 });
    await openPage({ status: "dimasak", tanggal: "kemarin", page: "-3" });
    expect(getOrders).toHaveBeenLastCalledWith({ status: undefined, date: todayWib(), q: undefined, page: 1 });
  });
  it("total dan galat diteruskan ke tabel", async () => {
    expect(JSON.stringify(await openPage({}))).toContain('"total":41');
    getOrders.mockResolvedValue({ error: { code: "X", message: "x" } });
    expect(JSON.stringify(await OrdersPage({ searchParams: Promise.resolve({}) }))).toContain('"loadFailed":true');
  });
});
