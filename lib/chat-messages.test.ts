// Test penggabung pesan chat: pesan dari cek berkala tidak tergandakan dan urutannya selalu menurut id.
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/types/order-chat";
import { mergeMessages } from "./chat-messages";

const message = (id: number, body = `pesan ${id}`): ChatMessage => ({
  id,
  sender_role: id % 2 ? "customer" : "merchant",
  body,
  image_url: null,
  created_at: "2026-11-24T03:00:00.000Z",
});

describe("mergeMessages", () => {
  it("pesan yang sama dari dua cek berkala hanya muncul sekali", () => {
    const merged = mergeMessages([message(1), message(2)], [message(2), message(3)]);
    expect(merged.map((item) => item.id)).toEqual([1, 2, 3]);
  });
  it("hasil selalu urut id naik walau masukan acak", () => {
    const merged = mergeMessages([message(5), message(1)], [message(4), message(2)]);
    expect(merged.map((item) => item.id)).toEqual([1, 2, 4, 5]);
  });
  it("versi baru dari id yang sama menggantikan versi lama; masukan asli tidak diubah", () => {
    const current = [message(1, "lama")];
    const merged = mergeMessages(current, [message(1, "baru")]);
    expect(merged).toEqual([message(1, "baru")]);
    expect(current[0].body).toBe("lama");
  });
  it("tanpa pesan baru -> isi sama", () => {
    expect(mergeMessages([message(1)], [])).toEqual([message(1)]);
  });
});
