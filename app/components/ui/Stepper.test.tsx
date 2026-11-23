// Test Stepper: batas min/max, ketikan tidak sah, tahan tombol, dan perbedaan sentuh/papan ketik.
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stepper } from "./Stepper";

function TestStepper({
  initial = 8,
  min = 8,
  max,
  reason,
}: {
  initial?: number;
  min?: number;
  max?: number;
  reason?: string;
}) {
  const [value, setValue] = useState(initial);
  return <Stepper label="Kuota" value={value} min={min} max={max} onChange={setValue} disabledReason={reason} />;
}

describe("Stepper (Review Focus 3)", () => {
  it("value=min -> tombol kurang nonaktif dan alasan terbaca", () => {
    render(<TestStepper reason="Sudah terjual dan ditahan 8 porsi." />);
    const minus = screen.getByRole("button", { name: /kurangi/i });
    expect(minus).toBeDisabled();
    expect(minus).toHaveAccessibleDescription("Sudah terjual dan ditahan 8 porsi.");
  });
  it("ketik 5 (di bawah min 8) lalu blur -> kembali 8", async () => {
    const user = userEvent.setup();
    render(<TestStepper />);
    const input = screen.getByRole("spinbutton", { name: "Kuota" });
    await user.clear(input);
    await user.type(input, "5");
    await user.tab();
    expect(input).toHaveValue(8);
  });
  it("ketik 2.5 lalu blur -> ditolak, kembali ke nilai sebelumnya", async () => {
    const user = userEvent.setup();
    render(<TestStepper initial={10} />);
    const input = screen.getByRole("spinbutton", { name: "Kuota" });
    await user.clear(input);
    await user.type(input, "2.5");
    await user.tab();
    expect(input).toHaveValue(10);
  });
  it("ketik 20 (valid) lalu blur -> tersimpan; lebih dari max -> kembali", async () => {
    const user = userEvent.setup();
    render(<TestStepper initial={10} max={30} />);
    const input = screen.getByRole("spinbutton", { name: "Kuota" });
    await user.clear(input);
    await user.type(input, "20");
    await user.tab();
    expect(input).toHaveValue(20);
    await user.clear(input);
    await user.type(input, "99");
    await user.tab();
    expect(input).toHaveValue(20);
  });
  it("tahan tombol tambah mengulang setelah 400 ms setiap 80 ms", () => {
    vi.useFakeTimers();
    render(<TestStepper initial={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
    act(() => {
      vi.advanceTimersByTime(400 + 80 * 3);
    });
    expect(screen.getByRole("spinbutton")).toHaveValue(14);
    fireEvent.pointerUp(plus);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole("spinbutton")).toHaveValue(14);
    vi.useRealTimers();
  });
  it("klik biasa menambah satu kali saja", async () => {
    const user = userEvent.setup();
    render(<TestStepper initial={10} />);
    await user.click(screen.getByRole("button", { name: /tambah/i }));
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
  });
  it("klik kanan/tengah tidak mengubah nilai dan tidak memulai pengulangan", () => {
    vi.useFakeTimers();
    render(<TestStepper initial={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus, { button: 2 });
    fireEvent.pointerDown(plus, { button: 1 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("spinbutton")).toHaveValue(10);
    vi.useRealTimers();
  });
  it("sentuh: pointerdown, pointerup, pointerleave (tanpa tombol), lalu klik -> melangkah tepat sekali", () => {
    render(<TestStepper initial={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus, { button: 0, buttons: 1 });
    fireEvent.pointerUp(plus, { button: 0, buttons: 0 });
    fireEvent.pointerLeave(plus, { buttons: 0 });
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
  });
  it("seret keluar tombol (masih ditekan) -> tanpa klik; aktivasi papan ketik berikutnya melangkah sekali", () => {
    render(<TestStepper initial={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus, { button: 0, buttons: 1 });
    fireEvent.pointerLeave(plus, { buttons: 1 });
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(12);
  });
  it("pointer dibatalkan tanpa klik -> aktivasi papan ketik berikutnya tidak tertelan", () => {
    render(<TestStepper initial={10} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.pointerDown(plus);
    fireEvent.pointerCancel(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton")).toHaveValue(12);
  });
  it("AUD-04 memanggil onDelta saat tombol +/- ditekan bila onDelta disediakan", async () => {
    const onDelta = vi.fn();
    const onChange = vi.fn();
    render(<Stepper label="Kuota" value={10} min={5} onChange={onChange} onDelta={onDelta} />);
    const plus = screen.getByRole("button", { name: /tambah/i });
    fireEvent.click(plus);
    expect(onDelta).toHaveBeenCalledWith(1);
    expect(onChange).not.toHaveBeenCalled();

    const minus = screen.getByRole("button", { name: /kurangi/i });
    fireEvent.click(minus);
    expect(onDelta).toHaveBeenCalledWith(-1);
  });
});
