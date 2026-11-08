import { describe, expect, it } from "vitest";
import { nextStatus, statusView, tampilanStatus } from "./order-status";
import type { MerchantOrder } from "@/types/order";

const base = {
  code: "KK-20261031-AAAA",
  status: "holding",
  payment_method: "cod",
  payment_status: "unpaid",
} as MerchantOrder;
const o = (p: Partial<MerchantOrder>): MerchantOrder => ({ ...base, ...p });

describe("nextStatus", () => {
  it("holding+cod confirm -> confirmed", () => {
    expect(nextStatus(o({}), "confirm")).toMatchObject({ status: "confirmed" });
  });
  it("holding+qris belum bayar confirm -> CONFLICT", () => {
    expect(nextStatus(o({ payment_method: "qris" }), "confirm")).toEqual({ error: "CONFLICT" });
  });
  it("F10 pay: qris belum bayar -> confirmed + paid; cod -> CONFLICT", () => {
    expect(nextStatus(o({ payment_method: "qris" }), "pay")).toMatchObject({ status: "confirmed", payment_status: "paid" });
    expect(nextStatus(o({}), "pay")).toEqual({ error: "CONFLICT" });
  });
  it("rantai masak", () => {
    expect(nextStatus(o({ status: "confirmed" }), "cook")).toMatchObject({ status: "cooking" });
    expect(nextStatus(o({ status: "cooking" }), "ready")).toMatchObject({ status: "ready" });
    expect(nextStatus(o({ status: "ready" }), "complete")).toMatchObject({ status: "completed" });
  });
  it("reject holding/confirmed -> cancelled, cooking -> CONFLICT", () => {
    expect(nextStatus(o({}), "reject")).toMatchObject({ status: "cancelled" });
    expect(nextStatus(o({ status: "confirmed" }), "reject")).toMatchObject({ status: "cancelled" });
    expect(nextStatus(o({ status: "cooking" }), "reject")).toEqual({ error: "CONFLICT" });
  });
  it("completed apa pun -> CONFLICT", () => {
    for (const a of ["confirm", "cook", "ready", "complete", "reject"] as const)
      expect(nextStatus(o({ status: "completed" }), a)).toEqual({ error: "CONFLICT" });
  });
  it("tidak mengubah objek asal", () => {
    const x = o({});
    nextStatus(x, "confirm");
    expect(x.status).toBe("holding");
  });
});

describe("peta status (brief v3 sec 4)", () => {
  const kasus: [Partial<MerchantOrder>, string, string | undefined, string[]][] = [
    [{}, "menunggu-konfirmasi", "confirm", ["reject", "chat-wa"]],
    [{ payment_method: "qris" }, "menunggu-bayar", "pay", ["chat-wa"]],
    [{ status: "confirmed" }, "confirmed", "cook", ["reject", "chat-wa"]],
    [{ status: "cooking" }, "cooking", "ready", ["chat-wa"]],
    [{ status: "ready" }, "ready", "complete", ["chat-wa"]],
    [{ status: "completed" }, "completed", undefined, ["lihat-slip"]],
    [{ status: "cancelled" }, "cancelled", undefined, ["lihat-slip"]],
    [{ status: "expired" }, "expired", undefined, ["lihat-slip"]],
  ];
  it.each(kasus)("%j", (p, key, primary, secondary) => {
    const k = tampilanStatus(o(p));
    expect(k).toBe(key);
    const v = statusView[k];
    expect(v.label).toBeTruthy();
    expect(v.icon).toBeTruthy();
    expect(v.tone).toBeTruthy();
    expect(v.primary).toBe(primary);
    expect(v.secondary).toEqual(secondary);
  });
  it("label sesuai brief", () => {
    expect(Object.values(statusView).map((v) => v.label)).toEqual([
      "Menunggu konfirmasi",
      "Menunggu pembayaran",
      "Dikonfirmasi",
      "Dimasak",
      "Siap diambil",
      "Selesai",
      "Dibatalkan",
      "Kadaluarsa",
    ]);
  });
  it("ada 8 tampilan", () => {
    expect(Object.keys(statusView)).toHaveLength(8);
  });
});
