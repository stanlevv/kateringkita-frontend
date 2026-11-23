import { describe, expect, it } from "vitest";
import { nextStatus, statusView, orderStatusView, displayStatus, successText } from "./order-status";
import type { MerchantOrder } from "@/types/order";

const base = {
  code: "KK-20261031-AAAA",
  status: "holding",
  payment_method: "cod",
  payment_status: "unpaid",
} as MerchantOrder;
const makeOrder = (overrides: Partial<MerchantOrder>): MerchantOrder => ({ ...base, ...overrides });

describe("F21 pesanan meja diantar ke meja, bukan diambil", () => {
  const withTable = { table: { id: 1, label: "5" } };
  it("dimasak: tombol utama 'Siap diantar'; siap: label 'Siap diantar'; toast 'siap diantar'", () => {
    expect(orderStatusView(makeOrder({ status: "cooking", ...withTable })).primaryLabel).toBe("Siap diantar");
    expect(orderStatusView(makeOrder({ status: "ready", ...withTable })).label).toBe("Siap diantar");
    expect(successText("ready", makeOrder(withTable))).toBe("siap diantar");
  });
  it("pesanan titik temu tetap 'Siap diambil'", () => {
    expect(orderStatusView(makeOrder({ status: "cooking", table: null })).primaryLabel).toBe("Siap diambil");
    expect(orderStatusView(makeOrder({ status: "ready", table: null })).label).toBe("Siap diambil");
    expect(successText("ready", makeOrder({ table: null }))).toBe("siap diambil");
    expect(successText("cook", makeOrder(withTable))).toBe("mulai dimasak");
  });
});

describe("nextStatus", () => {
  it("holding+cod confirm -> confirmed", () => {
    expect(nextStatus(makeOrder({}), "confirm")).toMatchObject({ status: "confirmed" });
  });
  it("holding+qris belum bayar confirm -> CONFLICT", () => {
    expect(nextStatus(makeOrder({ payment_method: "qris" }), "confirm")).toEqual({ error: "CONFLICT" });
  });
  it("F26 VA/online belum lunas: konfirmasi ditolak (lunas diterima otomatis oleh Midtrans)", () => {
    for (const payment_method of ["va", "online"] as const)
      expect(nextStatus(makeOrder({ payment_method }), "confirm")).toEqual({ error: "CONFLICT" });
    expect(nextStatus(makeOrder({ payment_method: "online", payment_status: "paid" }), "confirm")).toMatchObject({
      status: "confirmed",
    });
  });
  it("rantai masak", () => {
    expect(nextStatus(makeOrder({ status: "confirmed" }), "cook")).toMatchObject({ status: "cooking" });
    expect(nextStatus(makeOrder({ status: "cooking" }), "ready")).toMatchObject({ status: "ready" });
    expect(nextStatus(makeOrder({ status: "ready" }), "complete")).toMatchObject({ status: "completed" });
  });
  it("reject holding/confirmed -> cancelled, cooking -> CONFLICT", () => {
    expect(nextStatus(makeOrder({}), "reject")).toMatchObject({ status: "cancelled" });
    expect(nextStatus(makeOrder({ status: "confirmed" }), "reject")).toMatchObject({ status: "cancelled" });
    expect(nextStatus(makeOrder({ status: "cooking" }), "reject")).toEqual({ error: "CONFLICT" });
  });
  it("completed apa pun -> CONFLICT", () => {
    for (const action of ["confirm", "cook", "ready", "complete", "reject"] as const)
      expect(nextStatus(makeOrder({ status: "completed" }), action)).toEqual({ error: "CONFLICT" });
  });
  it("tidak mengubah objek asal", () => {
    const order = makeOrder({});
    nextStatus(order, "confirm");
    expect(order.status).toBe("holding");
  });
});

describe("peta status (brief v3 sec 4)", () => {
  const cases: [Partial<MerchantOrder>, string, string | undefined, string[]][] = [
    [{}, "menunggu-konfirmasi", "confirm", ["reject", "chat-wa"]],
    [{ payment_method: "online" }, "menunggu-bayar", undefined, ["chat-wa"]],
    [{ status: "confirmed" }, "confirmed", "cook", ["reject", "chat-wa"]],
    [{ status: "cooking" }, "cooking", "ready", ["chat-wa"]],
    [{ status: "ready" }, "ready", "complete", ["chat-wa"]],
    [{ status: "completed" }, "completed", undefined, ["lihat-slip"]],
    [{ status: "cancelled" }, "cancelled", undefined, ["lihat-slip"]],
    [{ status: "expired" }, "expired", undefined, ["lihat-slip"]],
  ];
  it.each(cases)("%j", (overrides, key, primary, secondary) => {
    const status = displayStatus(makeOrder(overrides));
    expect(status).toBe(key);
    const view = statusView[status];
    expect(view.label).toBeTruthy();
    expect(view.icon).toBeTruthy();
    expect(view.tone).toBeTruthy();
    expect(view.primary).toBe(primary);
    expect(view.secondary).toEqual(secondary);
  });
  it("label sesuai brief", () => {
    expect(Object.values(statusView).map((view) => view.label)).toEqual([
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
  it("F26 menunggu bayar: tanpa tombol utama, keterangan diterima otomatis", () => {
    expect(statusView["menunggu-bayar"].hint).toBe("Diterima otomatis setelah lunas");
  });
  it("ada 8 tampilan", () => {
    expect(Object.keys(statusView)).toHaveLength(8);
  });
});
