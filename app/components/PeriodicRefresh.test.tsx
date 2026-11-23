import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
import { PeriodicRefresh } from "./PeriodicRefresh";

const setVisibility = (state: DocumentVisibilityState) =>
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockReset();
  setVisibility("visible");
});
afterEach(() => {
  vi.useRealTimers();
});

describe("MuatUlangBerkala", () => {
  it("memuat ulang data server tiap 5 detik selama tab terlihat", () => {
    render(<PeriodicRefresh />);
    act(() => vi.advanceTimersByTime(4999));
    expect(refresh).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("tab tersembunyi: tidak memuat ulang", () => {
    setVisibility("hidden");
    render(<PeriodicRefresh />);
    act(() => vi.advanceTimersByTime(15000));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("berhenti setelah dilepas dari halaman", () => {
    const { unmount } = render(<PeriodicRefresh />);
    unmount();
    act(() => vi.advanceTimersByTime(15000));
    expect(refresh).not.toHaveBeenCalled();
  });
});
