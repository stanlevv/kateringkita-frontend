import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stepper } from "./Stepper";

function Uji({ awal = 8, min = 8, max, alasan }: { awal?: number; min?: number; max?: number; alasan?: string }) {
  const [v, setV] = useState(awal);
  return <Stepper label="Kuota" value={v} min={min} max={max} onChange={setV} disabledReason={alasan} />;
}

describe("Stepper (Review Focus 3)", () => {
  it("value=min -> tombol kurang nonaktif dan alasan terbaca", () => {
    render(<Uji alasan="Sudah terjual dan ditahan 8 porsi." />);
    const minus = screen.getByRole("button", { name: /kurangi/i });
    expect(minus).toBeDisabled();
    expect(minus).toHaveAccessibleDescription("Sudah terjual dan ditahan 8 porsi.");
  });
  it("ketik 5 (di bawah min 8) lalu blur -> kembali 8", async () => {
    const u = userEvent.setup();
    render(<Uji />);
    const input = screen.getByRole("spinbutton", { name: "Kuota" });
    await u.clear(input);
    await u.type(input, "5");
    await u.tab();
    expect(input).toHaveValue(8);
  });
  it("ketik 2.5 lalu blur -> ditolak, kembali ke nilai sebelumnya", async () => {
    const u = userEvent.setup();
    render(<Uji awal={10} />);
    const input = screen.getByRole("spinbutton", { name: "Kuota" });
    await u.clear(input);
    await u.type(input, "2.5");
    await u.tab();
    expect(input).toHaveValue(10);
  });
  it("ketik 20 (valid) lalu blur -> tersimpan; lebih dari max -> kembali", async () => {
    const u = userEvent.setup();
    render(<Uji awal={10} max={30} />);
    const input = screen.getByRole("spinbutton", { name: "Kuota" });
    await u.clear(input);
    await u.type(input, "20");
    await u.tab();
    expect(input).toHaveValue(20);
    await u.clear(input);
    await u.type(input, "99");
    await u.tab();
    expect(input).toHaveValue(20);
  });
  it("tahan tombol tambah mengulang setelah 400 ms setiap 80 ms", () => {
    vi.useFakeTimers();
    render(<Uji awal={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
    act(() => { vi.advanceTimersByTime(400 + 80 * 3); });
    expect(screen.getByRole("spinbutton")).toHaveValue(14);
    fireEvent.pointerUp(plus);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByRole("spinbutton")).toHaveValue(14);
    vi.useRealTimers();
  });
  it("klik biasa menambah satu kali saja", async () => {
    const u = userEvent.setup();
    render(<Uji awal={10} />);
    await u.click(screen.getByRole("button", { name: /tambah/i }));
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
  });
  it("klik kanan/tengah tidak mengubah nilai dan tidak memulai pengulangan", () => {
    vi.useFakeTimers();
    render(<Uji awal={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus, { button: 2 });
    fireEvent.pointerDown(plus, { button: 1 });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole("spinbutton")).toHaveValue(10);
    vi.useRealTimers();
  });
  it("sentuh: pointerdown, pointerup, pointerleave (tanpa tombol), lalu klik -> melangkah tepat sekali", () => {
    render(<Uji awal={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus, { button: 0, buttons: 1 });
    fireEvent.pointerUp(plus, { button: 0, buttons: 0 });
    fireEvent.pointerLeave(plus, { buttons: 0 });
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
  });
  it("seret keluar tombol (masih ditekan) -> tanpa klik; aktivasi papan ketik berikutnya melangkah sekali", () => {
    render(<Uji awal={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus, { button: 0, buttons: 1 });
    fireEvent.pointerLeave(plus, { buttons: 1 });
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(12);
  });
  it("pointer dibatalkan tanpa klik -> aktivasi papan ketik berikutnya tidak tertelan", () => {
    render(<Uji awal={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus);
    fireEvent.pointerCancel(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(12);
  });
});
