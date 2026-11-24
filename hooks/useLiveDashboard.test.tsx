// Test useLiveDashboard: jeda polling, galat dan mundur, sesi habis, selisih jam, serta penggabungan data.
// fetch, jam, dan visibilitas tab dipalsukan agar siklus polling bisa diatur waktunya.
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { menus as fixMenus } from "@/lib/fixtures/menus";
import { orders as fixOrders } from "@/lib/fixtures/orders";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { useLiveDashboard } from "@/hooks/useLiveDashboard";

const PAGE_LOADED_AT = Date.parse("2026-11-01T03:00:00.000Z");
const buildOrder = (overrides: Partial<MerchantOrder>): MerchantOrder => ({
  ...fixOrders()[0],
  status: "confirmed",
  hold_until: null,
  seconds_left: null,
  ...overrides,
});
const ORDER_A = buildOrder({ code: "A", updated_at: "2026-11-01T02:59:50.000Z" });
const ORDER_B = buildOrder({ code: "B", updated_at: "2026-11-01T02:59:40.000Z" });
const MENUS = fixMenus().slice(0, 2);

const fetchMock = vi.fn();
const okResponse = (orders: MerchantOrder[] = [], menus: MerchantMenu[] = MENUS) =>
  ({
    ok: true,
    status: 200,
    redirected: false,
    url: "",
    json: async () => ({ data: { orders, menus } }),
  }) as unknown as Response;
const errorResponse = () =>
  ({ ok: false, status: 503, redirected: false, url: "", json: async () => ({ error: {} }) }) as unknown as Response;
/** Fetch yang menggantung sampai `resolveFetch()` dipanggil; menolak saat dibatalkan. */
function hangFetch() {
  let resolveFetch: (response: Response) => void = () => {};
  fetchMock.mockImplementationOnce(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        resolveFetch = resolve;
        init.signal?.addEventListener("abort", () => reject(new DOMException("batal", "AbortError")));
      }),
  );
  return (response: Response) => resolveFetch(response);
}
const advance = (milliseconds: number) => act(() => vi.advanceTimersByTimeAsync(milliseconds));
const sinceParam = (callIndex: number) =>
  new URL(fetchMock.mock.calls[callIndex][0] as string, "http://x").searchParams.get("sejak");
const mountHook = (orders = [ORDER_A, ORDER_B], menus = MENUS) =>
  renderHook(
    (props: { orders: MerchantOrder[]; menus: MerchantMenu[] }) =>
      useLiveDashboard({ ...props, loadedAt: PAGE_LOADED_AT }),
    {
      initialProps: { orders, menus },
    },
  );

let visibility: DocumentVisibilityState = "visible";
const setVisibility = (state: DocumentVisibilityState) => {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
};
const assign = vi.fn();
const reload = vi.fn();

beforeEach(() => {
  vi.useFakeTimers({ now: PAGE_LOADED_AT });
  fetchMock.mockReset().mockImplementation(async () => okResponse());
  vi.stubGlobal("fetch", fetchMock);
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  // Peramban lama (Safari < 17.4, Chrome < 116) tanpa AbortSignal.any/timeout: siklus tetap harus jalan.
  vi.spyOn(AbortSignal, "any").mockImplementation(() => {
    throw new TypeError("AbortSignal.any tidak ada");
  });
  vi.spyOn(AbortSignal, "timeout").mockImplementation(() => {
    throw new TypeError("AbortSignal.timeout tidak ada");
  });
  assign.mockReset();
  reload.mockReset();
  vi.stubGlobal("location", { ...window.location, assign, reload });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("jeda saat terlihat", () => {
  it("tidak ada fetch sebelum 5 dtk; lalu 1 fetch dengan sejak = updated_at terbesar - 5 dtk", async () => {
    mountHook();
    await advance(4900);
    expect(fetchMock).not.toHaveBeenCalled();
    await advance(100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sinceParam(0)).toBe("2026-11-01T02:59:45.000Z");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal: expect.any(AbortSignal) });
  });
  it("pesanan baru dari respons ditambahkan, terakhir maju; tanpa perubahan -> referensi orders sama", async () => {
    const orderC = buildOrder({ code: "C", updated_at: "2026-11-01T03:00:01.000Z" });
    fetchMock.mockImplementationOnce(async () => okResponse([orderC]));
    const { result } = mountHook();
    expect(result.current.lastSyncedAt).toBe(PAGE_LOADED_AT);
    await advance(5000);
    expect(result.current.orders.map((order) => order.code)).toEqual(["A", "B", "C"]);
    expect(result.current.lastSyncedAt).toBe(PAGE_LOADED_AT + 5000);
    const previousOrders = result.current.orders;
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.orders).toBe(previousOrders);
  });
  it("satu permintaan pada satu waktu; setelah selesai jadwal berikutnya 5 dtk", async () => {
    mountHook();
    await advance(5000);
    const resolveFetch = hangFetch();
    fetchMock.mockClear();
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(20_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => resolveFetch(okResponse()));
    await advance(4900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("tab tersembunyi", () => {
  it("fetch berikut setelah 30 dtk; kembali terlihat -> fetch langsung", async () => {
    visibility = "hidden";
    mountHook();
    await advance(29_000);
    expect(fetchMock).not.toHaveBeenCalled();
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => setVisibility("visible"));
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("galat", () => {
  it("503 -> putus, mundur 10, 20, 40, 60, 60 dtk; sukses -> pulih dan kembali 5 dtk", async () => {
    fetchMock.mockImplementation(async () => errorResponse());
    const { result } = mountHook();
    await advance(5000);
    expect(result.current.disconnected).toBe(true);
    expect(result.current.lastSyncedAt).toBe(PAGE_LOADED_AT);
    for (const [delay, callCount] of [
      [10_000, 2],
      [20_000, 3],
      [40_000, 4],
      [60_000, 5],
      [60_000, 6],
    ]) {
      await advance(delay - 100);
      expect(fetchMock).toHaveBeenCalledTimes(callCount - 1);
      await advance(100);
      expect(fetchMock).toHaveBeenCalledTimes(callCount);
    }
    fetchMock.mockImplementation(async () => okResponse());
    await advance(60_000);
    expect(result.current.disconnected).toBe(false);
    const callsSoFar = fetchMock.mock.calls.length;
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(callsSoFar + 1);
  });
  it("offline -> putus; online -> fetch langsung", async () => {
    const { result } = mountHook();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await act(async () => window.dispatchEvent(new Event("offline")));
    expect(result.current.disconnected).toBe(true);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    await act(async () => window.dispatchEvent(new Event("online")));
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.disconnected).toBe(false);
  });
  it("sesi habis (redirected) -> muat ulang halaman, tanpa jadwal lagi", async () => {
    fetchMock.mockImplementation(
      async () =>
        ({ ok: true, status: 200, redirected: true, url: "http://localhost/login?alasan=sesi-habis" }) as Response,
    );
    mountHook();
    await advance(5000);
    expect(reload).toHaveBeenCalled();
    await advance(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("jam server", () => {
  it("holding di respons -> selisih ~ 2000 ms", async () => {
    const holdingOrder = buildOrder({
      code: "H",
      status: "holding",
      updated_at: "2026-11-01T03:00:04.000Z",
      hold_until: new Date(PAGE_LOADED_AT + 5000 + 302_000).toISOString(),
      seconds_left: 300,
    });
    fetchMock.mockImplementationOnce(async () => okResponse([holdingOrder]));
    const { result } = mountHook();
    expect(result.current.clockOffset).toBe(0);
    await advance(5000);
    expect(result.current.clockOffset).toBe(2000);
  });
});

describe("terima & awal", () => {
  it("receiveOrder(o) lebih baru langsung tampil; poll lama yang tiba kemudian tidak menimpanya", async () => {
    const { result } = mountHook();
    await advance(4999);
    const resolveFetch = hangFetch();
    await advance(1);
    const newerOrder = { ...ORDER_A, status: "cooking" as const, updated_at: "2026-11-01T03:00:05.000Z" };
    act(() => result.current.receiveOrder(newerOrder));
    expect(result.current.orders.find((order) => order.code === "A")?.status).toBe("cooking");
    await act(async () =>
      resolveFetch(okResponse([{ ...ORDER_A, status: "confirmed" as const, updated_at: "2026-11-01T03:00:00.000Z" }])),
    );
    expect(result.current.orders.find((order) => order.code === "A")?.status).toBe("cooking");
  });
  it("refresh() saat fetch berjalan -> tetap 1 permintaan, diulang segera setelah selesai", async () => {
    const { result } = mountHook();
    const resolveFetch = hangFetch();
    await advance(5000);
    act(() => result.current.refresh());
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => resolveFetch(okResponse()));
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("refresh() -> fetch sekarang, tanpa menunggu 5 dtk", async () => {
    const { result } = mountHook();
    act(() => result.current.refresh());
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(4900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("receiveMenu(m) mengganti menu ber-id sama", () => {
    const { result } = mountHook();
    act(() => result.current.receiveMenu({ ...MENUS[0], sold_today: 99 }));
    expect(result.current.menus[0].sold_today).toBe(99);
    expect(result.current.menus[1]).toBe(MENUS[1]);
  });
  it("awal baru (hasil refresh) disatukan; pesanan dari poll tetap ada", async () => {
    const orderC = buildOrder({ code: "C", updated_at: "2026-11-01T03:00:01.000Z" });
    fetchMock.mockImplementationOnce(async () => okResponse([orderC]));
    const { result, rerender } = mountHook();
    await advance(5000);
    const orderD = buildOrder({ code: "D", updated_at: "2026-11-01T03:00:02.000Z" });
    rerender({ orders: [ORDER_A, ORDER_B, orderD], menus: MENUS });
    expect(result.current.orders.map((order) => order.code).sort()).toEqual(["A", "B", "C", "D"]);
  });
});

describe("unmount", () => {
  it("fetch berjalan dibatalkan; tidak ada setState setelah unmount", async () => {
    const consoleError = vi.spyOn(console, "error");
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { unmount } = mountHook();
    hangFetch();
    await advance(5000);
    unmount();
    expect(abortSpy).toHaveBeenCalled();
    await advance(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("sinkron tidak melewatkan pesanan", () => {
  it("1. antrean kosong & jam perangkat 3 mnt lebih cepat -> sejak tetap dari jam server halaman (dimuat - 60 dtk)", async () => {
    vi.setSystemTime(PAGE_LOADED_AT + 180_000);
    const orderC = buildOrder({ code: "C", updated_at: new Date(PAGE_LOADED_AT + 1000).toISOString() });
    fetchMock
      .mockImplementationOnce(async () => okResponse([]))
      .mockImplementationOnce(async () => okResponse([orderC]));
    const { result } = mountHook([], MENUS);
    await advance(5000);
    expect(sinceParam(0)).toBe(new Date(PAGE_LOADED_AT - 60_000).toISOString());
    await advance(5000);
    expect(sinceParam(1)).toBe(new Date(PAGE_LOADED_AT - 60_000).toISOString()); // bukan jam perangkat setelah poll pertama
    expect(result.current.orders.map((order) => order.code)).toEqual(["C"]);
  });
  it("2. sesi habis: handler /api/dashboard/sinkron mengalihkan ke /login?alasan=sesi-habis -> location.reload, bukan ke url JSON", async () => {
    fetchMock.mockImplementation(
      async () =>
        ({ ok: true, status: 200, redirected: true, url: "http://localhost/login?alasan=sesi-habis" }) as Response,
    );
    mountHook();
    await advance(5000);
    expect(fetchMock.mock.calls[0][0]).toMatch(/^\/api\/dashboard\/sinkron\?sejak=/);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
    await advance(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("3. poll yang berjalan saat kuota disimpan tidak menimpa menu itu; pesanan tetap disatukan", async () => {
    const { result } = mountHook();
    const resolveFetch = hangFetch();
    await advance(5000);
    act(() => result.current.receiveMenu({ ...MENUS[0], quota_today: 99 }));
    const orderC = buildOrder({ code: "C", updated_at: "2026-11-01T03:00:01.000Z" });
    await act(async () => resolveFetch(okResponse([orderC], MENUS)));
    expect(result.current.menus[0].quota_today).toBe(99);
    expect(result.current.orders.map((order) => order.code)).toContain("C");
    await advance(5000); // poll berikutnya (tanpa simpan baru) memakai menu server lagi
    expect(result.current.menus[0].quota_today).toBe(MENUS[0].quota_today);
  });
  it("4. permintaan menggantung 15 dtk -> dibatalkan, dihitung gagal (putus, mundur 10 dtk)", async () => {
    const { result } = mountHook();
    hangFetch();
    await advance(5000);
    expect(result.current.disconnected).toBe(false);
    await advance(15_000);
    expect(result.current.disconnected).toBe(true);
    await advance(9900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("6. selisih jam disemai dari data awal halaman (holding seconds_left > 0)", () => {
    const holdingOrder = buildOrder({
      code: "H",
      status: "holding",
      hold_until: new Date(PAGE_LOADED_AT + 302_000).toISOString(),
      seconds_left: 300,
    });
    const { result } = mountHook([holdingOrder, ORDER_B]);
    expect(result.current.clockOffset).toBe(2000);
  });
  it("6. selisih jam dari respons aksi holding (terima)", () => {
    const { result } = mountHook();
    act(() =>
      result.current.receiveOrder(
        buildOrder({
          code: "H",
          status: "holding",
          updated_at: "2026-11-01T03:00:00.000Z",
          hold_until: new Date(PAGE_LOADED_AT + 303_000).toISOString(),
          seconds_left: 300,
        }),
      ),
    );
    expect(result.current.clockOffset).toBe(3000);
  });
});
