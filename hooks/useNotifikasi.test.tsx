import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { orders as fixOrders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { useNotifikasi } from "@/hooks/useNotifikasi";

const T0 = Date.parse("2026-11-01T03:00:00.000Z"); // 10.00 WIB
const o = (code: string, p: Partial<MerchantOrder> = {}): MerchantOrder => ({ ...fixOrders()[0], code, status: "holding", created_at: new Date(T0 - 600_000).toISOString(), ...p });
const awal = [o("LAMA")];
const pasang = () => renderHook((p: { orders: MerchantOrder[] }) => useNotifikasi(p.orders, T0), { initialProps: { orders: awal } });

beforeEach(() => {
  vi.useFakeTimers({ now: T0 });
  vi.stubGlobal("AudioContext", undefined);
  try { localStorage.setItem("kk_suara", "0"); } catch { /* abaikan */ }
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("D9 / review 8: hanya holding baru hari ini (WIB) yang dianggap pesanan baru", () => {
  it("kode baru berstatus selain holding atau dibuat kemarin (WIB) tidak disorot/diumumkan", () => {
    const { result, rerender } = pasang();
    rerender({ orders: [...awal, o("SELESAI", { status: "completed" }), o("KEMARIN", { created_at: "2026-10-31T16:00:00.000Z" })] });
    expect(result.current.baru).toEqual([]);
    expect(result.current.umumkan).toBe("");
  });
  it("holding baru hari ini -> disorot & diumumkan", () => {
    const { result, rerender } = pasang();
    rerender({ orders: [...awal, o("BARU", { created_at: new Date(T0).toISOString() })] });
    expect(result.current.baru).toEqual(["BARU"]);
    expect(result.current.umumkan).toMatch(/^1 pesanan baru masuk/);
  });
});

describe("review A/C: pesanan dibayar & jam server", () => {
  it("kode baru berstatus confirmed (dibayar QRIS saat tab tersembunyi) dibuat hari ini -> disorot", () => {
    const { result, rerender } = pasang();
    rerender({ orders: [...awal, o("LUNAS", { status: "confirmed", created_at: new Date(T0).toISOString() })] });
    expect(result.current.baru).toEqual(["LUNAS"]);
  });
  it("hari ini dari jam server (jam perangkat + selisih), bukan jam perangkat", () => {
    const SERVER = Date.parse("2026-11-01T16:59:00.000Z"); // 23.59 WIB
    vi.setSystemTime(SERVER + 120_000); // perangkat 2 mnt lebih cepat: sudah 2 Nov WIB
    const { result, rerender } = renderHook((p: { orders: MerchantOrder[] }) => useNotifikasi(p.orders, SERVER, SERVER), { initialProps: { orders: awal } });
    rerender({ orders: [...awal, o("MALAM", { created_at: new Date(SERVER - 30_000).toISOString() })] });
    expect(result.current.baru).toEqual(["MALAM"]);
  });
});

describe("D9 / review 10: pengumuman berulang tetap terbaca", () => {
  it("dua gelombang '1 pesanan baru masuk' berturut-turut menghasilkan teks berbeda", () => {
    const { result, rerender } = pasang();
    const satu = [...awal, o("B1", { created_at: new Date(T0).toISOString() })];
    rerender({ orders: satu });
    const pertama = result.current.umumkan;
    act(() => vi.advanceTimersByTime(1000));
    rerender({ orders: [...satu, o("B2", { created_at: new Date(T0).toISOString() })] });
    expect(pertama).toMatch(/^1 pesanan baru masuk/);
    expect(result.current.umumkan).toMatch(/^1 pesanan baru masuk/);
    expect(result.current.umumkan).not.toBe(pertama);
  });
});
