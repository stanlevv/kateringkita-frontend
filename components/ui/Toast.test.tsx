import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster, toast, dismissToast } from "./Toast";

afterEach(() => { vi.useRealTimers(); });

describe("Toast (G-6)", () => {
  it("tampil di region aria-live polite, fokus tidak pindah, hilang setelah 4 dtk", () => {
    vi.useFakeTimers();
    render(<><button>Pembuka</button><Toaster /></>);
    screen.getByRole("button", { name: "Pembuka" }).focus();
    act(() => { toast({ tone: "success", message: "Tersimpan" }); });
    const region = screen.getByRole("region", { name: "Pemberitahuan" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("Tersimpan");
    expect(screen.getByRole("button", { name: "Pembuka" })).toHaveFocus();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(region).not.toHaveTextContent("Tersimpan");
  });
  it("timer berhenti saat kursor di atas toast atau fokus di dalamnya, lanjut setelah keluar", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => { toast({ tone: "info", message: "Menu dinonaktifkan", action: { label: "Batalkan", onClick: vi.fn() } }); });
    const kartu = screen.getByText("Menu dinonaktifkan").parentElement!;
    fireEvent.mouseEnter(kartu);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByText("Menu dinonaktifkan")).toBeInTheDocument();
    fireEvent.mouseLeave(kartu);
    act(() => { screen.getByRole("button", { name: "Batalkan" }).focus(); });
    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByText("Menu dinonaktifkan")).toBeInTheDocument();
    act(() => { screen.getByRole("button", { name: "Batalkan" }).blur(); });
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByText("Menu dinonaktifkan")).toBeNull();
  });
  it("tone danger tidak hilang otomatis, ditutup manual", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => { toast({ tone: "danger", message: "Gagal menyimpan" }); });
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByText("Gagal menyimpan")).toBeInTheDocument();
    act(() => { screen.getByRole("button", { name: "Tutup" }).click(); });
    expect(screen.queryByText("Gagal menyimpan")).toBeNull();
  });
  it("aksi Batalkan memanggil onClick dan menutup toast", () => {
    render(<Toaster />);
    const onClick = vi.fn();
    let id = 0;
    act(() => { id = toast({ tone: "info", message: "Menu dinonaktifkan", action: { label: "Batalkan", onClick } }); });
    act(() => { screen.getByRole("button", { name: "Batalkan" }).click(); });
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText("Menu dinonaktifkan")).toBeNull();
    dismissToast(id);
  });
});
