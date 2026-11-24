// Test server action chat pesanan (app/actions/order-chat.ts): kirim, tandai dibaca, lapor, dan minta alamat unggah.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  merchantFetch: (...args: unknown[]) => merchantFetch(...args),
}));
import { markChatRead, reportChat, requestChatUpload, sendChatMessage } from "./order-chat";

const MESSAGE = { id: 7, sender_role: "merchant", body: "Halo", image_url: null, created_at: "2026-11-24T03:00:00Z" };
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body);

beforeEach(() => {
  requireMerchant.mockClear();
  merchantFetch.mockReset().mockResolvedValue({ ok: true, status: 201, data: MESSAGE });
});

describe("sendChatMessage", () => {
  it("POST /orders/:code/messages dengan teks yang di-trim; wajib sesi", async () => {
    expect(await sendChatMessage("KK 1", { body: "  Halo  " })).toEqual({ data: MESSAGE });
    expect(requireMerchant).toHaveBeenCalledOnce();
    expect(merchantFetch.mock.calls[0][0]).toBe("/orders/KK%201/messages");
    expect(bodyOf(merchantFetch.mock.calls[0])).toEqual({ body: "Halo" });
  });
  it("pesan foto saja mengirim image_url tanpa body", async () => {
    await sendChatMessage("KK-1", { image_url: "https://cdn.example/orders/1/chat/a.webp" });
    expect(bodyOf(merchantFetch.mock.calls[0])).toEqual({ image_url: "https://cdn.example/orders/1/chat/a.webp" });
  });
  it.each([{}, { body: "   " }, { body: "x".repeat(1001) }])("isi tidak sah %# -> galat tanpa fetch", async (input) => {
    const result = await sendChatMessage("KK-1", input);
    expect(result).toEqual({ error: { code: "VALIDATION_ERROR", message: "Pesan 1–1000 karakter." } });
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("409 dari backend diteruskan apa adanya", async () => {
    const error = { code: "CHAT_CLOSED", message: "Chat sudah ditutup karena pesanan selesai atau dibatalkan." };
    merchantFetch.mockResolvedValue({ ok: false, status: 409, error });
    expect(await sendChatMessage("KK-1", { body: "Halo" })).toEqual({ error });
  });
});

describe("markChatRead", () => {
  it("POST .../messages/read dengan last_id; 204 -> { data: true }", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 204 });
    expect(await markChatRead("KK-1", 12)).toEqual({ data: true });
    expect(merchantFetch.mock.calls[0][0]).toBe("/orders/KK-1/messages/read");
    expect(bodyOf(merchantFetch.mock.calls[0])).toEqual({ last_id: 12 });
  });
  it("last_id bukan bilangan bulat >= 0 -> galat tanpa fetch", async () => {
    expect("error" in (await markChatRead("KK-1", -1))).toBe(true);
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});

describe("reportChat", () => {
  it("POST .../chat-report dengan alasan yang di-trim", async () => {
    merchantFetch.mockResolvedValue({ ok: true, status: 201, data: { id: 3 } });
    expect(await reportChat("KK-1", "  Kata kasar  ")).toEqual({ data: { id: 3 } });
    expect(merchantFetch.mock.calls[0][0]).toBe("/orders/KK-1/chat-report");
    expect(bodyOf(merchantFetch.mock.calls[0])).toEqual({ reason: "Kata kasar" });
  });
  it.each(["abcd", "x".repeat(501)])("alasan di luar 5–500 karakter -> galat tanpa fetch", async (reason) => {
    expect(await reportChat("KK-1", reason)).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Alasan 5–500 karakter." },
    });
    expect(merchantFetch).not.toHaveBeenCalled();
  });
});

describe("requestChatUpload", () => {
  it("POST .../messages/upload dengan jenis dan ukuran file", async () => {
    const upload = { upload_url: "https://r2/put", public_url: "https://cdn/a.webp", expires_at: "x" };
    merchantFetch.mockResolvedValue({ ok: true, status: 200, data: upload });
    expect(await requestChatUpload("KK-1", { content_type: "image/webp", size: 1000 })).toEqual({ data: upload });
    expect(merchantFetch.mock.calls[0][0]).toBe("/orders/KK-1/messages/upload");
    expect(bodyOf(merchantFetch.mock.calls[0])).toEqual({ content_type: "image/webp", size: 1000 });
  });
});
