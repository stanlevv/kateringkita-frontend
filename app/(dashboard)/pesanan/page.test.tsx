// Test halaman /pesanan: searchParams diteruskan ke getOrders (nilai tak sah diabaikan) dan hasilnya ke OrderTable,
// serta filter ?chat=belum-dibalas yang memakai getUnrepliedChats.
// Services dan OrderTable dipalsukan (vi.mock).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getOrders = vi.fn();
vi.mock("@/services/auth.service", () => ({ requireMerchant: async () => ({ user: {}, merchant: null }) }));
vi.mock("@/services/order.service", () => ({ getOrders: (...args: unknown[]) => getOrders(...args) }));
vi.mock("@/app/(dashboard)/pesanan/components/OrderTable", () => ({ OrderTable: () => null }));
const getUnrepliedChats = vi.fn();
vi.mock("@/services/order-chat.service", () => ({ getUnrepliedChats: () => getUnrepliedChats() }));
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
  it("?chat=belum-dibalas: daftar dari /merchant/chats/unreplied, tanpa getOrders; pil belum dibaca hanya bila > 0", async () => {
    getOrders.mockClear();
    getUnrepliedChats.mockResolvedValue({
      data: {
        total: 2,
        orders: [
          { code: "KK-20261124-AB12", status: "confirmed", unread_count: 2, last_message_at: "2026-11-24T03:00:00Z" },
          { code: "KK-20261124-CD34", status: "ready", unread_count: 0, last_message_at: "2026-11-24T03:30:00Z" },
        ],
      },
    });
    render(await OrdersPage({ searchParams: Promise.resolve({ chat: "belum-dibalas" }) }));
    expect(getOrders).not.toHaveBeenCalled();
    const first = screen.getByRole("link", { name: /KK-20261124-AB12/ });
    expect(first).toHaveAttribute("href", "/pesanan/KK-20261124-AB12");
    expect(first).toHaveTextContent("2 belum dibaca");
    expect(first).toHaveTextContent("Menunggu balasan sejak 10.00");
    const second = screen.getByRole("link", { name: /KK-20261124-CD34/ });
    expect(second).toHaveTextContent("Menunggu balasan sejak 10.30");
    expect(second).not.toHaveTextContent("belum dibaca");
    expect(screen.getByRole("link", { name: "Chat belum dibalas" })).toHaveAttribute("aria-current", "page");
  });
  it("?chat=belum-dibalas: daftar kosong -> Semua chat sudah dibalas", async () => {
    getUnrepliedChats.mockResolvedValue({ data: { total: 0, orders: [] } });
    render(await OrdersPage({ searchParams: Promise.resolve({ chat: "belum-dibalas" }) }));
    expect(screen.getByText("Semua chat sudah dibalas")).toBeInTheDocument();
  });
  it("tanpa filter chat: getUnrepliedChats tidak dipanggil, tautan filter tetap ada", async () => {
    getUnrepliedChats.mockClear();
    render(await openPage({}));
    expect(getUnrepliedChats).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Chat belum dibalas" })).toHaveAttribute(
      "href",
      "/pesanan?chat=belum-dibalas",
    );
    expect(screen.getByRole("link", { name: "Semua pesanan" })).toHaveAttribute("aria-current", "page");
  });
});
