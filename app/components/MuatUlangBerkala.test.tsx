import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
import { MuatUlangBerkala } from "./MuatUlangBerkala";

const tampak = (v: DocumentVisibilityState) =>
  Object.defineProperty(document, "visibilityState", { value: v, configurable: true });

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockReset();
  tampak("visible");
});
afterEach(() => {
  vi.useRealTimers();
});

describe("MuatUlangBerkala", () => {
  it("memuat ulang data server tiap 5 detik selama tab terlihat", () => {
    render(<MuatUlangBerkala />);
    act(() => vi.advanceTimersByTime(4999));
    expect(refresh).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("tab tersembunyi: tidak memuat ulang", () => {
    tampak("hidden");
    render(<MuatUlangBerkala />);
    act(() => vi.advanceTimersByTime(15000));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("berhenti setelah dilepas dari halaman", () => {
    const { unmount } = render(<MuatUlangBerkala />);
    unmount();
    act(() => vi.advanceTimersByTime(15000));
    expect(refresh).not.toHaveBeenCalled();
  });
});
