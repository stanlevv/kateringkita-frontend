// Test service chat pesanan penjual: path backend, after_id, ringkasan chat belum dibaca, dan efek skenario pratinjau.
// Cookie skenario dan merchantFetch dipalsukan (vi.mock), jadi test berjalan tanpa backend.
import { afterEach, describe, expect, it, vi } from "vitest";

const jar = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "kk_skenario" && jar.value ? { name, value: jar.value } : undefined),
  }),
}));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  merchantFetch: (...args: unknown[]) => merchantFetch(...args),
}));
import { getOrderChat, getUnreadChatCount, getUnreadChats } from "./order-chat.service";

const UNREAD = { total: 3, orders: [{ code: "KK-1", unread_count: 3, last_message_at: "2026-11-24T03:00:00.000Z" }] };

afterEach(() => {
  merchantFetch.mockReset();
  vi.unstubAllEnvs();
  jar.value = undefined;
});

describe("getOrderChat", () => {
  it("GET /orders/:code/messages; after_id hanya dikirim bila ada", async () => {
    const chatData = { messages: [], chat: { is_open: true } };
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: chatData });
    expect(await getOrderChat("KK 1")).toEqual({ data: chatData });
    expect(merchantFetch).toHaveBeenLastCalledWith("/orders/KK%201/messages");
    await getOrderChat("KK-1", 0);
    expect(merchantFetch).toHaveBeenLastCalledWith("/orders/KK-1/messages?after_id=0");
  });
  it("galat backend diteruskan", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "x" } });
    expect(await getOrderChat("KK-1")).toEqual({ error: { code: "NOT_FOUND", message: "x" } });
  });
});

describe("getUnreadChats dan getUnreadChatCount", () => {
  it("GET /chats/unread; jumlah badge = total", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: UNREAD });
    expect(await getUnreadChats()).toEqual({ data: UNREAD });
    expect(merchantFetch).toHaveBeenCalledWith("/chats/unread");
    expect(await getUnreadChatCount()).toBe(3);
  });
  it("galat -> badge 0", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "INTERNAL_ERROR", message: "x" } });
    expect(await getUnreadChatCount()).toBe(0);
  });
  it("skenario pratinjau: kosong tanpa memanggil backend, gagal-muat -> galat", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jar.value = "kosong";
    expect(await getUnreadChats()).toEqual({ data: { total: 0, orders: [] } });
    jar.value = "gagal-muat";
    expect(await getUnreadChats()).toMatchObject({ error: { code: "INTERNAL_ERROR" } });
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});
