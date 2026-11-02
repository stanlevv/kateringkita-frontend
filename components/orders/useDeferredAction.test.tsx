import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeferredAction } from "./useDeferredAction";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const pasang = () => {
  const run = vi.fn();
  const h = renderHook(() => useDeferredAction(run, 5000));
  return { run, ...h };
};

describe("DB-A2 / Review Focus 2: aksi ditunda tepat sekali", () => {
  it("dijalankan sekali setelah 5 dtk, pending selama menunggu", () => {
    const { run, result } = pasang();
    act(() => result.current.schedule("A", "confirm"));
    expect(result.current.pending).toEqual({ A: "confirm" });
    act(() => vi.advanceTimersByTime(4999));
    expect(run).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(run).toHaveBeenCalledExactlyOnceWith("A", "confirm");
    expect(result.current.pending).toEqual({});
    act(() => vi.advanceTimersByTime(10_000));
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("Batalkan sebelum 5 dtk -> tidak pernah dijalankan", () => {
    const { run, result, unmount } = pasang();
    act(() => result.current.schedule("A", "confirm"));
    let batal = false;
    act(() => { batal = result.current.undo("A"); });
    expect(batal).toBe(true);
    expect(result.current.undo("A")).toBe(false);
    act(() => vi.advanceTimersByTime(10_000));
    unmount();
    expect(run).not.toHaveBeenCalled();
  });
  it("dilepas (pindah halaman) sebelum 5 dtk -> dijalankan sekali, tidak lagi saat waktu habis", () => {
    const { run, result, unmount } = pasang();
    act(() => result.current.schedule("A", "confirm"));
    unmount();
    expect(run).toHaveBeenCalledExactlyOnceWith("A", "confirm");
    vi.advanceTimersByTime(10_000);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("pagehide (tutup/pindah tab) -> dijalankan sekali; unmount sesudahnya tidak dobel", () => {
    const { run, result, unmount } = pasang();
    act(() => result.current.schedule("A", "confirm"));
    act(() => { window.dispatchEvent(new Event("pagehide")); });
    expect(run).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(10_000));
    unmount();
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("dua pesanan ditunda bersamaan berjalan masing-masing sekali", () => {
    const { run, result } = pasang();
    act(() => result.current.schedule("A", "confirm"));
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.schedule("B", "cook"));
    act(() => vi.advanceTimersByTime(3000));
    expect(run).toHaveBeenCalledExactlyOnceWith("A", "confirm");
    act(() => vi.advanceTimersByTime(2000));
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith("B", "cook");
  });
  it("menjadwalkan ulang kunci yang sama menjalankan yang lama dulu", () => {
    const { run, result } = pasang();
    act(() => result.current.schedule("A", "confirm"));
    act(() => result.current.schedule("A", "cook"));
    expect(run).toHaveBeenCalledExactlyOnceWith("A", "confirm");
    act(() => vi.advanceTimersByTime(5000));
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith("A", "cook");
  });
});
