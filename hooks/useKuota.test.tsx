import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adjustQuota = vi.fn();
vi.mock("@/app/actions/menus", () => ({
  adjustQuota: (...a: unknown[]) => adjustQuota(...a),
}));

import { menus } from "@/lib/fixtures/menus";
import type { MerchantMenu } from "@/types/menu";
import { useKuota } from "./useKuota";

const ayam = menus()[0]; // kuota 40, terjual 22, ditahan 3 -> tersedia 15
// Referensi array stabil untuk mencegah reset draf akibat menus !== dariMenus
const STABLE_MENUS: MerchantMenu[] = [{ ...ayam, id: 1, quota_today: 10, sold_today: 0, held_today: 0, available: 10 }];

describe("useKuota - AUD-04 Kuota Atomik & Konkurensi", () => {
  beforeEach(() => {
    adjustQuota.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("regresi AUD-04: demonstrasi mengapa pengiriman kuota mutlak menyebabkan lost update", async () => {
    let serverQuota = 10;
    // Server simulasi: jika klien mengirim quota_today absolut, nilai langsung ditimpa
    adjustQuota.mockImplementation(async (_id, ubah) => {
      if ("quota_today" in ubah) {
        serverQuota = ubah.quota_today;
      }
      return { data: { ...STABLE_MENUS[0], quota_today: serverQuota, available: serverQuota } };
    });

    // Simulasi dua tab (A dan B) membaca kuota 10, lalu masing-masing menekan +1 dan mengirim { quota_today: 11 }
    await adjustQuota(1, { quota_today: 11 }); // Klien A
    await adjustQuota(1, { quota_today: 11 }); // Klien B

    // Bukti lost update: hasil akhir tetap 11, penambahan dari salah satu klien hilang!
    expect(serverQuota).toBe(11);
  });

  it("AUD-04: dua klien menekan +1 mengirim delta sehingga server mengakumulasikan menjadi 12", async () => {
    let serverQuota = 10;
    adjustQuota.mockImplementation(async (_id, ubah) => {
      if ("delta" in ubah) {
        serverQuota += ubah.delta;
      } else if ("quota_today" in ubah) {
        serverQuota = ubah.quota_today;
      }
      return { data: { ...STABLE_MENUS[0], quota_today: serverQuota, available: serverQuota } };
    });

    const onBerubahA = vi.fn();
    const onBerubahB = vi.fn();
    const { result: clientA } = renderHook(() => useKuota(onBerubahA, STABLE_MENUS));
    const { result: clientB } = renderHook(() => useKuota(onBerubahB, STABLE_MENUS));

    // Klien A menekan +1
    act(() => {
      clientA.current.ubahDelta(1, 1);
    });
    expect(clientA.current.dengan(STABLE_MENUS[0]).quota_today).toBe(11);

    // Klien B menekan +1 (sebelum respons server tiba)
    act(() => {
      clientB.current.ubahDelta(1, 1);
    });
    expect(clientB.current.dengan(STABLE_MENUS[0]).quota_today).toBe(11);

    // Debounce selesai dan kedua request dikirim
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(adjustQuota).toHaveBeenCalledWith(1, { delta: 1 });
    expect(adjustQuota).toHaveBeenCalledTimes(2);
    expect(serverQuota).toBe(12);
  });

  it("operasi campuran: ketik 20 lalu +1 sebelum debounce -> kirim absolut 21", async () => {
    adjustQuota.mockResolvedValue({ data: { ...STABLE_MENUS[0], quota_today: 21, available: 21 } });
    const { result } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    act(() => {
      result.current.ubahMutlak(1, 20);
      result.current.ubahDelta(1, 1);
    });
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(21);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(adjustQuota).toHaveBeenCalledExactlyOnceWith(1, { quota_today: 21 });
  });

  it("operasi campuran: +1 lalu ketik 20 sebelum debounce -> kirim absolut 20", async () => {
    adjustQuota.mockResolvedValue({ data: { ...STABLE_MENUS[0], quota_today: 20, available: 20 } });
    const { result } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    act(() => {
      result.current.ubahDelta(1, 1);
      result.current.ubahMutlak(1, 20);
    });
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(20);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(adjustQuota).toHaveBeenCalledExactlyOnceWith(1, { quota_today: 20 });
  });

  it("supresi delta nol: +1 lalu -1 sebelum debounce tidak memanggil adjustQuota", async () => {
    const { result } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    act(() => {
      result.current.ubahDelta(1, 1);
      result.current.ubahDelta(1, -1);
    });
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(10);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(adjustQuota).not.toHaveBeenCalled();
  });

  it("serialisasi in-flight: mutasi saat request berjalan ditahan dan dieksekusi sekuensial (max 1 in-flight)", async () => {
    let resolveFirst: (v: unknown) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    adjustQuota
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ data: { ...STABLE_MENUS[0], quota_today: 12, available: 12 } });

    const { result } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    // Request pertama: +1
    act(() => {
      result.current.ubahDelta(1, 1);
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(adjustQuota).toHaveBeenCalledTimes(1);

    // Saat request pertama in-flight, user klik +1 lagi
    act(() => {
      result.current.ubahDelta(1, 1);
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Request kedua TIDAK boleh dipanggil selama request pertama masih in-flight
    expect(adjustQuota).toHaveBeenCalledTimes(1);

    // Selesaikan request pertama
    await act(async () => {
      resolveFirst!({ data: { ...STABLE_MENUS[0], quota_today: 11, available: 11 } });
    });

    // Request kedua otomatis dieksekusi setelahnya
    expect(adjustQuota).toHaveBeenCalledTimes(2);
    expect(adjustQuota).toHaveBeenLastCalledWith(1, { delta: 1 });
  });

  it("rollback granular: kegagalan request delta tidak membatalkan mutasi pending berikutnya", async () => {
    let rejectFirst: (v: unknown) => void;
    const firstPromise = new Promise((resolve) => {
      rejectFirst = resolve;
    });

    adjustQuota
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ data: { ...STABLE_MENUS[0], quota_today: 11, available: 11 } });

    const { result } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    // Request pertama: +2
    act(() => {
      result.current.ubahDelta(1, 2);
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(12);

    // Mutasi kedua saat in-flight: +1 -> draf lokal menjadi 13
    act(() => {
      result.current.ubahDelta(1, 1);
    });
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(13);

    // Request pertama gagal (ditolak 409)
    await act(async () => {
      rejectFirst!({ error: { code: "CONFLICT", message: "Gagal simpan" } });
    });

    // Efek +2 dibatalkan (13 - 2 = 11), draf menjadi 11, dan request kedua (+1) otomatis dikirim
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(11);
    expect(adjustQuota).toHaveBeenCalledTimes(2);
    expect(adjustQuota).toHaveBeenLastCalledWith(1, { delta: 1 });
  });

  it("rekonstruksi draf: baseline 10, request +2 in-flight, ketik 25, request +2 ditolak -> draf tetap 25, kirim absolut 25", async () => {
    let rejectFirst: (v: unknown) => void;
    const firstPromise = new Promise((resolve) => {
      rejectFirst = resolve;
    });

    adjustQuota
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ data: { ...STABLE_MENUS[0], quota_today: 25, available: 25 } });

    const { result } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    // Request pertama: +2 in-flight
    act(() => {
      result.current.ubahDelta(1, 2);
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(12);

    // Pengguna mengetik 25 saat request pertama in-flight
    act(() => {
      result.current.ubahMutlak(1, 25);
    });
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(25);

    // Request pertama ditolak
    await act(async () => {
      rejectFirst!({ error: { code: "CONFLICT", message: "Ditolak" } });
    });

    // Draf TETAP 25 (nilai mutlak tidak boleh dikurangi oleh delta gagal)
    expect(result.current.dengan(STABLE_MENUS[0]).quota_today).toBe(25);

    // Request berikutnya mengirim nilai absolut 25
    expect(adjustQuota).toHaveBeenCalledTimes(2);
    expect(adjustQuota).toHaveBeenLastCalledWith(1, { quota_today: 25 });
  });

  it("unmount saat request in-flight: pending tetap dikirim sekali secara berurutan tanpa request paralel atau ganda", async () => {
    let resolveFirst: (v: unknown) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    adjustQuota
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ data: { ...STABLE_MENUS[0], quota_today: 12, available: 12 } });

    const { result, unmount } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    // Request 1 in-flight
    act(() => {
      result.current.ubahDelta(1, 1);
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(adjustQuota).toHaveBeenCalledTimes(1);

    // Klik +1 lagi
    act(() => {
      result.current.ubahDelta(1, 1);
    });

    // Unmount komponen saat Request 1 masih in-flight
    unmount();

    // Tidak boleh ada request paralel saat unmount
    expect(adjustQuota).toHaveBeenCalledTimes(1);

    // Saat Request 1 selesai: pending yang tertunda langsung dikirim sekuensial
    await act(async () => {
      resolveFirst!({ data: { ...STABLE_MENUS[0], quota_today: 11, available: 11 } });
    });

    expect(adjustQuota).toHaveBeenCalledTimes(2);
    expect(adjustQuota).toHaveBeenLastCalledWith(1, { delta: 1 });
  });

  it("unmount saat debounce: pending di-flush seketika", () => {
    adjustQuota.mockResolvedValue({ data: { ...STABLE_MENUS[0], quota_today: 13, available: 13 } });
    const { result, unmount } = renderHook(() => useKuota(vi.fn(), STABLE_MENUS));

    act(() => {
      result.current.ubahDelta(1, 3);
    });
    expect(adjustQuota).not.toHaveBeenCalled();

    // Unmount sebelum timer 500ms
    unmount();

    expect(adjustQuota).toHaveBeenCalledExactlyOnceWith(1, { delta: 3 });
  });
});

