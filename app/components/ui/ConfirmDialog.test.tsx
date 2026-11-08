import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

function Uji({ onConfirm = vi.fn(), ...p }: { onConfirm?: (r?: string) => void; requireReason?: boolean; reasons?: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Tolak</button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} title="Tolak pesanan?" body="Pembeli akan diberi tahu." confirmLabel="Ya, tolak" tone="danger" onConfirm={onConfirm} {...p} />
    </>
  );
}

describe("ConfirmDialog (G-4)", () => {
  it("requireReason: konfirmasi nonaktif sampai alasan dipilih; Lainnya wajib teks", async () => {
    const u = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Uji requireReason reasons={["Stok habis", "Dapur tutup"]} onConfirm={onConfirm} />);
    await u.click(screen.getByRole("button", { name: "Tolak" }));
    const ok = screen.getByRole("button", { name: "Ya, tolak" });
    expect(ok).toBeDisabled();
    await u.click(screen.getByRole("radio", { name: "Lainnya" }));
    expect(ok).toBeDisabled();
    await u.type(screen.getByRole("textbox", { name: /alasan/i }), "Listrik mati");
    expect(ok).toBeEnabled();
    await u.click(ok);
    expect(onConfirm).toHaveBeenCalledWith("Listrik mati");
  });
  it("memilih alasan baku mengirim teks alasan itu", async () => {
    const u = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Uji requireReason reasons={["Stok habis"]} onConfirm={onConfirm} />);
    await u.click(screen.getByRole("button", { name: "Tolak" }));
    await u.click(screen.getByRole("radio", { name: "Stok habis" }));
    await u.click(screen.getByRole("button", { name: "Ya, tolak" }));
    expect(onConfirm).toHaveBeenCalledWith("Stok habis");
  });
  it("Esc menutup dan fokus kembali ke pembuka", async () => {
    const u = userEvent.setup();
    render(<Uji />);
    const pembuka = screen.getByRole("button", { name: "Tolak" });
    await u.click(pembuka);
    expect(screen.getByRole("dialog", { name: "Tolak pesanan?" })).toBeInTheDocument();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(pembuka).toHaveFocus();
  });
  it("memilih Lainnya memindahkan fokus ke kolom alasan", async () => {
    const u = userEvent.setup();
    render(<Uji requireReason reasons={["Stok habis"]} />);
    await u.click(screen.getByRole("button", { name: "Tolak" }));
    await u.click(screen.getByRole("radio", { name: "Lainnya" }));
    expect(screen.getByRole("textbox", { name: /alasan/i })).toHaveFocus();
  });
  it("Batal menutup tanpa memanggil onConfirm", async () => {
    const u = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Uji onConfirm={onConfirm} />);
    await u.click(screen.getByRole("button", { name: "Tolak" }));
    await u.click(screen.getByRole("button", { name: "Batal" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
