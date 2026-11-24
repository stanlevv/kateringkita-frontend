// Test halaman /pesanan: searchParams diteruskan ke getOrders (nilai tak sah diabaikan) dan hasilnya ke OrderTable,
// serta filter ?chat=belum-dibalas yang memakai getUnreadChats.
// Services dan OrderTable dipalsukan (vi.mock).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getOrders = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireMerchant: async () => ({ user: {}, merchant: null }) }));
vi.mock("@/services/order.service", () => ({ getOrders: (...args: unknown[]) => getOrders(...args) }));
vi.mock("@/app/(dashboard)/pesanan/components/OrderTable", () => ({ OrderTable: () => null }));
const getUnreadChats = vi.fn();
vi.mock("@/services/order-chat.service", () => ({ getUnreadChats: () => getUnreadChats() }));
import { todayWib } from "@/lib/format";
import OrdersPage from "./page";

const openPage = async (query: Record<string, string | string[] | undefined>) => {
  getOrders.mockResolvedValue({ data: { rows: [], total: 41 } });
  return OrdersPage({ searchParams: Promise.resolve(query) });
};

describe("halaman daftar pesanan", () => {
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
  it("?chat=belum-dibalas: daftar chat belum dibalas dari /merchant/chats/unread, tanpa getOrders", async () => {
    getOrders.mockClear();
    getUnreadChats.mockResolvedValue({
      data: {
        total: 2,
        orders: [{ code: "KK-20261124-AB12", unread_count: 2, last_message_at: "2026-11-24T03:00:00Z" }],
      },
    });
    render(await OrdersPage({ searchParams: Promise.resolve({ chat: "belum-dibalas" }) }));
    expect(getOrders).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /KK-20261124-AB12/ })).toHaveAttribute("href", "/pesanan/KK-20261124-AB12");
    expect(screen.getByText("2 pesan baru")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chat belum dibalas" })).toHaveAttribute("aria-current", "page");
  });
  it("tanpa filter chat: getUnreadChats tidak dipanggil, tautan filter tetap ada", async () => {
    getUnreadChats.mockClear();
    render(await openPage({}));
    expect(getUnreadChats).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Chat belum dibalas" })).toHaveAttribute(
      "href",
      "/pesanan?chat=belum-dibalas",
    );
    expect(screen.getByRole("link", { name: "Semua pesanan" })).toHaveAttribute("aria-current", "page");
  });
});
