import { describe, expect, it, vi } from "vitest";

const getOrders = vi.fn();
vi.mock("@/services/authService", () => ({ requireMerchant: async () => ({ user: {}, merchant: null }) }));
vi.mock("@/services/orderService", () => ({ getOrders: (...a: unknown[]) => getOrders(...a) }));
vi.mock("@/app/(dashboard)/pesanan/components/OrderTable", () => ({ OrderTable: () => null }));
import { hariIniWib } from "@/lib/format";
import PesananPage from "./page";

const buka = async (sp: Record<string, string | string[] | undefined>) => {
  getOrders.mockResolvedValue({ data: { rows: [], total: 41 } });
  return PesananPage({ searchParams: Promise.resolve(sp) });
};

describe("PS-N1 halaman daftar pesanan", () => {
  it("searchParams diteruskan ke getOrders", async () => {
    await buka({ status: "ready", tanggal: "2026-11-01", q: " rina ", page: "2" });
    expect(getOrders).toHaveBeenLastCalledWith({ status: "ready", tanggal: "2026-11-01", q: "rina", page: 2 });
  });
  it("tanpa parameter: hari ini WIB, halaman 1; nilai tak sah diabaikan", async () => {
    await buka({});
    expect(getOrders).toHaveBeenLastCalledWith({ status: undefined, tanggal: hariIniWib(), q: undefined, page: 1 });
    await buka({ status: "dimasak", tanggal: "kemarin", page: "-3" });
    expect(getOrders).toHaveBeenLastCalledWith({ status: undefined, tanggal: hariIniWib(), q: undefined, page: 1 });
  });
  it("total dan galat diteruskan ke tabel", async () => {
    expect(JSON.stringify(await buka({}))).toContain('"total":41');
    getOrders.mockResolvedValue({ error: { code: "X", message: "x" } });
    expect(JSON.stringify(await PesananPage({ searchParams: Promise.resolve({}) }))).toContain('"galat":true');
  });
});
