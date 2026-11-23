// Test server action orderAction (app/actions/orders.ts): aksi pesanan, alasan tolak, skenario pratinjau, dan galat backend.
// Pemeriksaan sesi dan panggilan ke backend dipalsukan (vi.mock), jadi test berjalan tanpa server.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const getScenario = vi.fn();
vi.mock("@/lib/scenario", () => ({ getScenario: () => getScenario() }));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/auth.service", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/api")>()),
  merchantFetch: (...args: unknown[]) => merchantFetch(...args),
}));
import { orders } from "@/lib/fixtures/orders";
import { orderAction } from "./orders";

const ORDER_CODE = "KK-20261031-7QF2";
const okResponse = (data: unknown) => ({ ok: true, status: 200, data });
const returnedOrder = orders()[0];

beforeEach(() => {
  getScenario.mockReset().mockResolvedValue(null);
  merchantFetch.mockReset().mockResolvedValue(okResponse(returnedOrder));
  requireMerchant.mockClear();
});

describe("orderAction (M-04, M-08, D15)", () => {
  it("wajib sesi: requireMerchant dipanggil", async () => {
    await orderAction(ORDER_CODE, "confirm");
    expect(requireMerchant).toHaveBeenCalledOnce();
  });
  it("tidak punya parameter status klien dan tidak membaca daftar pesanan", () => {
    const source = readFileSync("app/actions/orders.ts", "utf8");
    expect(source).toMatch(/orderAction\(\s*code: string,\s*action: OrderAction,\s*reason\?: string,?\s*\)/);
    expect(source).not.toContain("current");
    expect(source).not.toContain("@/services/order.service");
  });
  it("POST /orders/:code/:aksi dengan body kosong; hasil diteruskan", async () => {
    const result = await orderAction(ORDER_CODE, "cook");
    expect(merchantFetch).toHaveBeenCalledWith(`/orders/${ORDER_CODE}/cook`, { method: "POST", body: "{}" });
    expect(result).toEqual({ data: returnedOrder });
  });
  it("reject mengirim alasan yang dipangkas", async () => {
    await orderAction("KK/1", "reject", "  Stok habis ");
    expect(merchantFetch).toHaveBeenCalledWith("/orders/KK%2F1/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "Stok habis" }),
    });
  });
  it("reject tanpa alasan -> VALIDATION_ERROR tanpa fetch", async () => {
    const result = await orderAction(ORDER_CODE, "reject", "  ");
    expect("error" in result && result.error.code).toBe("VALIDATION_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("aksi tak dikenal atau kode bukan string -> VALIDATION_ERROR tanpa fetch", async () => {
    for (const [code, action] of [
      [ORDER_CODE, "hapus"],
      [ORDER_CODE, "toString"],
      [42, "confirm"],
      [null, "confirm"],
    ] as const) {
      const result = await orderAction(code as never, action as never);
      expect("error" in result && result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("galat backend diteruskan apa adanya (409, 404)", async () => {
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "Pesanan belum dibayar." },
    });
    expect(await orderAction(ORDER_CODE, "confirm")).toEqual({
      error: { code: "CONFLICT", message: "Pesanan belum dibayar." },
    });
    merchantFetch.mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan." },
    });
    expect(await orderAction("KK-X", "cook")).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
  it("DB-E1 skenario gagal-aksi -> INTERNAL_ERROR tanpa fetch", async () => {
    getScenario.mockResolvedValue("gagal-aksi");
    const result = await orderAction(ORDER_CODE, "confirm");
    expect("error" in result && result.error.code).toBe("INTERNAL_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("DB-E2 skenario status-berubah -> CONFLICT tanpa fetch", async () => {
    getScenario.mockResolvedValue("status-berubah");
    const result = await orderAction(ORDER_CODE, "confirm");
    expect("error" in result && result.error.code).toBe("CONFLICT");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("DB-E3 skenario stok-bentrok hanya untuk konfirmasi -> OUT_OF_STOCK", async () => {
    getScenario.mockResolvedValue("stok-bentrok");
    const result = await orderAction(ORDER_CODE, "confirm");
    expect("error" in result && result.error.code).toBe("OUT_OF_STOCK");
    await orderAction("KK-20261031-C5RW", "cook");
    expect(merchantFetch).toHaveBeenCalledTimes(1);
  });
});
