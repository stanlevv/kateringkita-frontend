// Test route handler /api/pesanan/[code]/chat: after_id tidak sah -> 400 tanpa memanggil backend, sukses -> 200 tanpa
// cache, galat backend -> 503, dan sesi diperiksa sebelum mengambil data. Service dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const getOrderChat = vi.fn();
vi.mock("@/services/order-chat.service", () => ({
  getOrderChat: (code: string, afterId?: number) => getOrderChat(code, afterId),
}));
import { GET } from "./route";

const callRoute = (query = "", code = "KK-1") =>
  GET(new NextRequest(`http://localhost/api/pesanan/${code}/chat${query}`), { params: Promise.resolve({ code }) });
const CHAT_DATA = { messages: [{ id: 1 }], chat: { is_open: true } };

beforeEach(() => {
  requireMerchant.mockReset().mockResolvedValue({});
  getOrderChat.mockReset().mockResolvedValue({ data: CHAT_DATA });
});

describe("GET /api/pesanan/[code]/chat", () => {
  it.each(["?after_id=abc", "?after_id=-1", "?after_id=1.5", "?after_id="])(
    "after_id bukan angka (%s) -> 400 tanpa fetch",
    async (query) => {
      const response = await callRoute(query);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid." } });
      expect(getOrderChat).not.toHaveBeenCalled();
    },
  );
  it("tanpa after_id -> seluruh riwayat; 200 + no-store", async () => {
    const response = await callRoute();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ data: CHAT_DATA });
    expect(getOrderChat).toHaveBeenCalledWith("KK-1", undefined);
  });
  it("after_id angka diteruskan sebagai bilangan", async () => {
    await callRoute("?after_id=42");
    expect(getOrderChat).toHaveBeenCalledWith("KK-1", 42);
  });
  it("galat backend -> 503 { error }", async () => {
    getOrderChat.mockResolvedValue({ error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan." } });
    const response = await callRoute();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan." } });
  });
  it("requireMerchant dipanggil sebelum fetch; melempar -> handler melempar tanpa fetch", async () => {
    requireMerchant.mockRejectedValue(new Error("REDIRECT:/login?alasan=sesi-habis"));
    await expect(callRoute()).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
    expect(getOrderChat).not.toHaveBeenCalled();
  });
});
