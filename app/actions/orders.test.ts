import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const getSkenario = vi.fn();
vi.mock("@/lib/skenario", () => ({ getSkenario: () => getSkenario() }));
const requireMerchant = vi.fn(async () => ({}));
vi.mock("@/services/authService", () => ({ requireMerchant: () => requireMerchant() }));
const merchantFetch = vi.fn();
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), merchantFetch: (...a: unknown[]) => merchantFetch(...a) }));
import { orders } from "@/lib/fixtures/orders";
import { orderAction } from "./orders";

const KODE = "KK-20261031-7QF2";
const ok = (data: unknown) => ({ ok: true, status: 200, data });
const kembali = orders()[0];

beforeEach(() => {
  getSkenario.mockReset().mockResolvedValue(null);
  merchantFetch.mockReset().mockResolvedValue(ok(kembali));
  requireMerchant.mockClear();
});

describe("orderAction (M-04, M-08, D15)", () => {
  it("wajib sesi: requireMerchant dipanggil", async () => {
    await orderAction(KODE, "confirm");
    expect(requireMerchant).toHaveBeenCalledOnce();
  });
  it("tidak punya parameter status klien dan tidak membaca daftar pesanan", () => {
    const src = readFileSync("app/actions/orders.ts", "utf8");
    expect(src).toContain("orderAction(code: string, aksi: AksiPesanan, reason?: string)");
    expect(src).not.toContain("current");
    expect(src).not.toContain("@/services/orderService");
  });
  it("POST /orders/:code/:aksi dengan body kosong; hasil diteruskan", async () => {
    const r = await orderAction(KODE, "cook");
    expect(merchantFetch).toHaveBeenCalledWith(`/orders/${KODE}/cook`, { method: "POST", body: "{}" });
    expect(r).toEqual({ data: kembali });
  });
  it("reject mengirim alasan yang dipangkas", async () => {
    await orderAction("KK/1", "reject", "  Stok habis ");
    expect(merchantFetch).toHaveBeenCalledWith("/orders/KK%2F1/reject", { method: "POST", body: JSON.stringify({ reason: "Stok habis" }) });
  });
  it("reject tanpa alasan -> VALIDATION_ERROR tanpa fetch", async () => {
    const r = await orderAction(KODE, "reject", "  ");
    expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("aksi tak dikenal atau kode bukan string -> VALIDATION_ERROR tanpa fetch", async () => {
    for (const [code, aksi] of [[KODE, "hapus"], [KODE, "toString"], [42, "confirm"], [null, "confirm"]] as const) {
      const r = await orderAction(code as never, aksi as never);
      expect("error" in r && r.error.code).toBe("VALIDATION_ERROR");
    }
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("galat backend diteruskan apa adanya (409, 404)", async () => {
    merchantFetch.mockResolvedValue({ ok: false, status: 409, error: { code: "CONFLICT", message: "Pesanan belum dibayar." } });
    expect(await orderAction(KODE, "confirm")).toEqual({ error: { code: "CONFLICT", message: "Pesanan belum dibayar." } });
    merchantFetch.mockResolvedValue({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan." } });
    expect(await orderAction("KK-X", "cook")).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
  it("DB-E1 skenario gagal-aksi -> INTERNAL_ERROR tanpa fetch", async () => {
    getSkenario.mockResolvedValue("gagal-aksi");
    const r = await orderAction(KODE, "confirm");
    expect("error" in r && r.error.code).toBe("INTERNAL_ERROR");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("DB-E2 skenario status-berubah -> CONFLICT tanpa fetch", async () => {
    getSkenario.mockResolvedValue("status-berubah");
    const r = await orderAction(KODE, "confirm");
    expect("error" in r && r.error.code).toBe("CONFLICT");
    expect(merchantFetch).not.toHaveBeenCalled();
  });
  it("DB-E3 skenario stok-bentrok hanya untuk konfirmasi -> OUT_OF_STOCK", async () => {
    getSkenario.mockResolvedValue("stok-bentrok");
    const r = await orderAction(KODE, "confirm");
    expect("error" in r && r.error.code).toBe("OUT_OF_STOCK");
    await orderAction("KK-20261031-C5RW", "cook");
    expect(merchantFetch).toHaveBeenCalledTimes(1);
  });
});
