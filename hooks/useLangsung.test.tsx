import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { menus as fixMenus } from "@/lib/fixtures/menus";
import { orders as fixOrders } from "@/lib/fixtures/orders";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { useLangsung } from "@/hooks/useLangsung";

const T0 = Date.parse("2026-11-01T03:00:00.000Z");
const o = (p: Partial<MerchantOrder>): MerchantOrder => ({ ...fixOrders()[0], status: "confirmed", hold_until: null, seconds_left: null, ...p });
const A = o({ code: "A", updated_at: "2026-11-01T02:59:50.000Z" });
const B = o({ code: "B", updated_at: "2026-11-01T02:59:40.000Z" });
const M = fixMenus().slice(0, 2);

const fetchMock = vi.fn();
const balas = (orders: MerchantOrder[] = [], menus: MerchantMenu[] = M) =>
  ({ ok: true, status: 200, redirected: false, url: "", json: async () => ({ data: { orders, menus } }) }) as unknown as Response;
const gagal = () => ({ ok: false, status: 503, redirected: false, url: "", json: async () => ({ error: {} }) }) as unknown as Response;
/** Fetch yang menggantung sampai `lepas()`; menolak saat dibatalkan. */
function gantung() {
  let lepas: (r: Response) => void = () => {};
  fetchMock.mockImplementationOnce((_u: string, init: RequestInit) => new Promise<Response>((res, rej) => {
    lepas = res;
    init.signal?.addEventListener("abort", () => rej(new DOMException("batal", "AbortError")));
  }));
  return (r: Response) => lepas(r);
}
const maju = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const sejakDari = (n: number) => new URL(fetchMock.mock.calls[n][0] as string, "http://x").searchParams.get("sejak");
const pasang = (orders = [A, B], menus = M) => renderHook((p: { orders: MerchantOrder[]; menus: MerchantMenu[] }) => useLangsung({ ...p, dimuat: T0 }), { initialProps: { orders, menus } });

let terlihat: DocumentVisibilityState = "visible";
const setTerlihat = (v: DocumentVisibilityState) => {
  terlihat = v;
  document.dispatchEvent(new Event("visibilitychange"));
};
const assign = vi.fn();
const reload = vi.fn();

beforeEach(() => {
  vi.useFakeTimers({ now: T0 });
  fetchMock.mockReset().mockImplementation(async () => balas());
  vi.stubGlobal("fetch", fetchMock);
  terlihat = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => terlihat);
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  // Peramban lama (Safari < 17.4, Chrome < 116) tanpa AbortSignal.any/timeout: siklus tetap harus jalan.
  vi.spyOn(AbortSignal, "any").mockImplementation(() => { throw new TypeError("AbortSignal.any tidak ada"); });
  vi.spyOn(AbortSignal, "timeout").mockImplementation(() => { throw new TypeError("AbortSignal.timeout tidak ada"); });
  assign.mockReset();
  reload.mockReset();
  vi.stubGlobal("location", { ...window.location, assign, reload });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("D6 jeda saat terlihat", () => {
  it("tidak ada fetch sebelum 5 dtk; lalu 1 fetch dengan sejak = updated_at terbesar - 5 dtk", async () => {
    pasang();
    await maju(4900);
    expect(fetchMock).not.toHaveBeenCalled();
    await maju(100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sejakDari(0)).toBe("2026-11-01T02:59:45.000Z");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal: expect.any(AbortSignal) });
  });
  it("pesanan baru dari respons ditambahkan, terakhir maju; tanpa perubahan -> referensi orders sama", async () => {
    const C = o({ code: "C", updated_at: "2026-11-01T03:00:01.000Z" });
    fetchMock.mockImplementationOnce(async () => balas([C]));
    const { result } = pasang();
    expect(result.current.terakhir).toBe(T0);
    await maju(5000);
    expect(result.current.orders.map((x) => x.code)).toEqual(["A", "B", "C"]);
    expect(result.current.terakhir).toBe(T0 + 5000);
    const sebelum = result.current.orders;
    await maju(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.orders).toBe(sebelum);
  });
  it("satu permintaan pada satu waktu; setelah selesai jadwal berikutnya 5 dtk", async () => {
    pasang();
    await maju(5000);
    const lepas = gantung();
    fetchMock.mockClear();
    await maju(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await maju(20_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => lepas(balas()));
    await maju(4900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await maju(100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("D6 tab tersembunyi", () => {
  it("fetch berikut setelah 30 dtk; kembali terlihat -> fetch langsung", async () => {
    terlihat = "hidden";
    pasang();
    await maju(29_000);
    expect(fetchMock).not.toHaveBeenCalled();
    await maju(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => setTerlihat("visible"));
    await maju(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("D7 galat", () => {
  it("503 -> putus, mundur 10, 20, 40, 60, 60 dtk; sukses -> pulih dan kembali 5 dtk", async () => {
    fetchMock.mockImplementation(async () => gagal());
    const { result } = pasang();
    await maju(5000);
    expect(result.current.putus).toBe(true);
    expect(result.current.terakhir).toBe(T0);
    for (const [jeda, n] of [[10_000, 2], [20_000, 3], [40_000, 4], [60_000, 5], [60_000, 6]]) {
      await maju(jeda - 100);
      expect(fetchMock).toHaveBeenCalledTimes(n - 1);
      await maju(100);
      expect(fetchMock).toHaveBeenCalledTimes(n);
    }
    fetchMock.mockImplementation(async () => balas());
    await maju(60_000);
    expect(result.current.putus).toBe(false);
    const n = fetchMock.mock.calls.length;
    await maju(5000);
    expect(fetchMock).toHaveBeenCalledTimes(n + 1);
  });
  it("offline -> putus; online -> fetch langsung", async () => {
    const { result } = pasang();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await act(async () => window.dispatchEvent(new Event("offline")));
    expect(result.current.putus).toBe(true);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    await act(async () => window.dispatchEvent(new Event("online")));
    await maju(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.putus).toBe(false);
  });
  it("sesi habis (redirected) -> muat ulang halaman, tanpa jadwal lagi", async () => {
    fetchMock.mockImplementation(async () => ({ ok: true, status: 200, redirected: true, url: "http://localhost/login?alasan=sesi-habis" }) as Response);
    pasang();
    await maju(5000);
    expect(reload).toHaveBeenCalled();
    await maju(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("D8 jam server", () => {
  it("holding di respons -> selisih ~ 2000 ms", async () => {
    const h = o({ code: "H", status: "holding", updated_at: "2026-11-01T03:00:04.000Z", hold_until: new Date(T0 + 5000 + 302_000).toISOString(), seconds_left: 300 });
    fetchMock.mockImplementationOnce(async () => balas([h]));
    const { result } = pasang();
    expect(result.current.selisih).toBe(0);
    await maju(5000);
    expect(result.current.selisih).toBe(2000);
  });
});

describe("D5/D10 terima & awal", () => {
  it("terima(o) lebih baru langsung tampil; poll lama yang tiba kemudian tidak menimpanya", async () => {
    const { result } = pasang();
    await maju(4999);
    const lepas = gantung();
    await maju(1);
    const baru = { ...A, status: "cooking" as const, updated_at: "2026-11-01T03:00:05.000Z" };
    act(() => result.current.terima(baru));
    expect(result.current.orders.find((x) => x.code === "A")?.status).toBe("cooking");
    await act(async () => lepas(balas([{ ...A, status: "confirmed" as const, updated_at: "2026-11-01T03:00:00.000Z" }])));
    expect(result.current.orders.find((x) => x.code === "A")?.status).toBe("cooking");
  });
  it("segarkan() saat fetch berjalan -> tetap 1 permintaan, diulang segera setelah selesai", async () => {
    const { result } = pasang();
    const lepas = gantung();
    await maju(5000);
    act(() => result.current.segarkan());
    await maju(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => lepas(balas()));
    await maju(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("segarkan() -> fetch sekarang, tanpa menunggu 5 dtk", async () => {
    const { result } = pasang();
    act(() => result.current.segarkan());
    await maju(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await maju(4900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("terimaMenu(m) mengganti menu ber-id sama", () => {
    const { result } = pasang();
    act(() => result.current.terimaMenu({ ...M[0], sold_today: 99 }));
    expect(result.current.menus[0].sold_today).toBe(99);
    expect(result.current.menus[1]).toBe(M[1]);
  });
  it("awal baru (hasil refresh) disatukan; pesanan dari poll tetap ada", async () => {
    const C = o({ code: "C", updated_at: "2026-11-01T03:00:01.000Z" });
    fetchMock.mockImplementationOnce(async () => balas([C]));
    const { result, rerender } = pasang();
    await maju(5000);
    const D = o({ code: "D", updated_at: "2026-11-01T03:00:02.000Z" });
    rerender({ orders: [A, B, D], menus: M });
    expect(result.current.orders.map((x) => x.code).sort()).toEqual(["A", "B", "C", "D"]);
  });
});

describe("D6 unmount", () => {
  it("fetch berjalan dibatalkan; tidak ada setState setelah unmount", async () => {
    const galatKonsol = vi.spyOn(console, "error");
    const batal = vi.spyOn(AbortController.prototype, "abort");
    const { unmount } = pasang();
    gantung();
    await maju(5000);
    unmount();
    expect(batal).toHaveBeenCalled();
    await maju(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(galatKonsol).not.toHaveBeenCalled();
  });
});

describe("review F16: sinkron tidak melewatkan pesanan", () => {
  it("1. antrean kosong & jam perangkat 3 mnt lebih cepat -> sejak tetap dari jam server halaman (dimuat - 60 dtk)", async () => {
    vi.setSystemTime(T0 + 180_000);
    const C = o({ code: "C", updated_at: new Date(T0 + 1000).toISOString() });
    fetchMock.mockImplementationOnce(async () => balas([])).mockImplementationOnce(async () => balas([C]));
    const { result } = pasang([], M);
    await maju(5000);
    expect(sejakDari(0)).toBe(new Date(T0 - 60_000).toISOString());
    await maju(5000);
    expect(sejakDari(1)).toBe(new Date(T0 - 60_000).toISOString()); // bukan jam perangkat setelah poll pertama
    expect(result.current.orders.map((x) => x.code)).toEqual(["C"]);
  });
  it("2. sesi habis: handler /api/dashboard/sinkron mengalihkan ke /login?alasan=sesi-habis -> location.reload, bukan ke url JSON", async () => {
    fetchMock.mockImplementation(async () => ({ ok: true, status: 200, redirected: true, url: "http://localhost/login?alasan=sesi-habis" }) as Response);
    pasang();
    await maju(5000);
    expect(fetchMock.mock.calls[0][0]).toMatch(/^\/api\/dashboard\/sinkron\?sejak=/);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
    await maju(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("3. poll yang berjalan saat kuota disimpan tidak menimpa menu itu; pesanan tetap disatukan", async () => {
    const { result } = pasang();
    const lepas = gantung();
    await maju(5000);
    act(() => result.current.terimaMenu({ ...M[0], quota_today: 99 }));
    const C = o({ code: "C", updated_at: "2026-11-01T03:00:01.000Z" });
    await act(async () => lepas(balas([C], M)));
    expect(result.current.menus[0].quota_today).toBe(99);
    expect(result.current.orders.map((x) => x.code)).toContain("C");
    await maju(5000); // poll berikutnya (tanpa simpan baru) memakai menu server lagi
    expect(result.current.menus[0].quota_today).toBe(M[0].quota_today);
  });
  it("4. permintaan menggantung 15 dtk -> dibatalkan, dihitung gagal (putus, mundur 10 dtk)", async () => {
    const { result } = pasang();
    gantung();
    await maju(5000);
    expect(result.current.putus).toBe(false);
    await maju(15_000);
    expect(result.current.putus).toBe(true);
    await maju(9900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await maju(100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("6. selisih jam disemai dari data awal halaman (holding seconds_left > 0)", () => {
    const h = o({ code: "H", status: "holding", hold_until: new Date(T0 + 302_000).toISOString(), seconds_left: 300 });
    const { result } = pasang([h, B]);
    expect(result.current.selisih).toBe(2000);
  });
  it("6. selisih jam dari respons aksi holding (terima)", () => {
    const { result } = pasang();
    act(() => result.current.terima(o({ code: "H", status: "holding", updated_at: "2026-11-01T03:00:00.000Z", hold_until: new Date(T0 + 303_000).toISOString(), seconds_left: 300 })));
    expect(result.current.selisih).toBe(3000);
  });
});
