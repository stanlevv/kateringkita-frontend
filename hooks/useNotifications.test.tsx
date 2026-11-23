import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { orders as fixOrders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { useNotifications } from "@/hooks/useNotifications";

const PAGE_LOADED_AT = Date.parse("2026-11-01T03:00:00.000Z"); // 10.00 WIB
const buildOrder = (code: string, overrides: Partial<MerchantOrder> = {}): MerchantOrder => ({
  ...fixOrders()[0],
  code,
  status: "holding",
  created_at: new Date(PAGE_LOADED_AT - 600_000).toISOString(),
  ...overrides,
});
const initialOrders = [buildOrder("LAMA")];
const mountHook = () =>
  renderHook((props: { orders: MerchantOrder[] }) => useNotifications(props.orders, PAGE_LOADED_AT), {
    initialProps: { orders: initialOrders },
  });

beforeEach(() => {
  vi.useFakeTimers({ now: PAGE_LOADED_AT });
  vi.stubGlobal("AudioContext", undefined);
  try {
    localStorage.setItem("kk_suara", "0");
  } catch {
    /* abaikan */
  }
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("D9 / review 8: hanya holding baru hari ini (WIB) yang dianggap pesanan baru", () => {
  it("kode baru berstatus selain holding atau dibuat kemarin (WIB) tidak disorot/diumumkan", () => {
    const { result, rerender } = mountHook();
    rerender({
      orders: [
        ...initialOrders,
        buildOrder("SELESAI", { status: "completed" }),
        buildOrder("KEMARIN", { created_at: "2026-10-31T16:00:00.000Z" }),
      ],
    });
    expect(result.current.newOrderCodes).toEqual([]);
    expect(result.current.announcement).toBe("");
  });
  it("holding baru hari ini -> disorot & diumumkan", () => {
    const { result, rerender } = mountHook();
    rerender({
      orders: [...initialOrders, buildOrder("BARU", { created_at: new Date(PAGE_LOADED_AT).toISOString() })],
    });
    expect(result.current.newOrderCodes).toEqual(["BARU"]);
    expect(result.current.announcement).toMatch(/^1 pesanan baru masuk/);
  });
});

describe("review A/C: pesanan dibayar & jam server", () => {
  it("kode baru berstatus confirmed (lunas saat tab tersembunyi) dibuat hari ini -> disorot", () => {
    const { result, rerender } = mountHook();
    rerender({
      orders: [
        ...initialOrders,
        buildOrder("LUNAS", { status: "confirmed", created_at: new Date(PAGE_LOADED_AT).toISOString() }),
      ],
    });
    expect(result.current.newOrderCodes).toEqual(["LUNAS"]);
  });
  it("F26: VA/online belum lunas tidak disorot; disorot saat lunas & diterima otomatis", () => {
    const { result, rerender } = mountHook();
    const unpaidOrder = buildOrder("VA", {
      payment_method: "va",
      payment_status: "unpaid",
      created_at: new Date(PAGE_LOADED_AT).toISOString(),
    });
    rerender({ orders: [...initialOrders, unpaidOrder] });
    expect(result.current.newOrderCodes).toEqual([]);
    rerender({ orders: [...initialOrders, { ...unpaidOrder, status: "confirmed", payment_status: "paid" }] });
    expect(result.current.newOrderCodes).toEqual(["VA"]);
  });
  it("pesanan yang sudah perlu tindakan tidak disorot ulang saat berpindah status", () => {
    const { result, rerender } = mountHook();
    rerender({ orders: [{ ...initialOrders[0], status: "confirmed" }] });
    expect(result.current.newOrderCodes).toEqual([]);
  });
  it("hari ini dari jam server (jam perangkat + selisih), bukan jam perangkat", () => {
    const SERVER = Date.parse("2026-11-01T16:59:00.000Z"); // 23.59 WIB
    vi.setSystemTime(SERVER + 120_000); // perangkat 2 mnt lebih cepat: sudah 2 Nov WIB
    const { result, rerender } = renderHook(
      (props: { orders: MerchantOrder[] }) => useNotifications(props.orders, SERVER, SERVER),
      { initialProps: { orders: initialOrders } },
    );
    rerender({
      orders: [...initialOrders, buildOrder("MALAM", { created_at: new Date(SERVER - 30_000).toISOString() })],
    });
    expect(result.current.newOrderCodes).toEqual(["MALAM"]);
  });
});

describe("D9 / review 10: pengumuman berulang tetap terbaca", () => {
  it("dua gelombang '1 pesanan baru masuk' berturut-turut menghasilkan teks berbeda", () => {
    const { result, rerender } = mountHook();
    const firstWave = [...initialOrders, buildOrder("B1", { created_at: new Date(PAGE_LOADED_AT).toISOString() })];
    rerender({ orders: firstWave });
    const firstAnnouncement = result.current.announcement;
    act(() => vi.advanceTimersByTime(1000));
    rerender({ orders: [...firstWave, buildOrder("B2", { created_at: new Date(PAGE_LOADED_AT).toISOString() })] });
    expect(firstAnnouncement).toMatch(/^1 pesanan baru masuk/);
    expect(result.current.announcement).toMatch(/^1 pesanan baru masuk/);
    expect(result.current.announcement).not.toBe(firstAnnouncement);
  });
});
