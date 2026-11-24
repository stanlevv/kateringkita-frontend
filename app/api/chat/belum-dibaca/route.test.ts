// Test route handler /api/chat/belum-dibaca: sukses -> 200 tanpa cache, galat backend -> 503 tanpa cache, dan sesi
// diperiksa sebelum mengambil data. Services dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const getUnreadChats = vi.fn();
vi.mock("@/services/order-chat.service", () => ({ getUnreadChats: () => getUnreadChats() }));
import { GET } from "./route";

const UNREAD = { total: 2, orders: [{ code: "KK-1", unread_count: 2, last_message_at: "2026-11-25T03:00:00.000Z" }] };

beforeEach(() => {
  requireMerchant.mockReset().mockResolvedValue({});
  getUnreadChats.mockReset().mockResolvedValue({ data: UNREAD });
});

describe("GET /api/chat/belum-dibaca", () => {
  it("sukses -> 200 { data: { total, orders } } + no-store", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ data: UNREAD });
  });
  it("backend galat -> 503 { error } + no-store", async () => {
    getUnreadChats.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." } });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan. Coba lagi." },
    });
  });
  it("requireMerchant melempar -> handler melempar tanpa mengambil data", async () => {
    requireMerchant.mockRejectedValue(new Error("REDIRECT:/login?alasan=sesi-habis"));
    await expect(GET()).rejects.toThrow("REDIRECT:/login?alasan=sesi-habis");
    expect(getUnreadChats).not.toHaveBeenCalled();
  });
});
