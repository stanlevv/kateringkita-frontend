import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

function TestDialog({
  onConfirm = vi.fn(),
  ...rest
}: {
  onConfirm?: (reason?: string) => void;
  requireReason?: boolean;
  reasons?: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Tolak</button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tolak pesanan?"
        body="Pembeli akan diberi tahu."
        confirmLabel="Ya, tolak"
        tone="danger"
        onConfirm={onConfirm}
        {...rest}
      />
    </>
  );
}

describe("ConfirmDialog (G-4)", () => {
  it("requireReason: konfirmasi nonaktif sampai alasan dipilih; Lainnya wajib teks", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<TestDialog requireReason reasons={["Stok habis", "Dapur tutup"]} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Tolak" }));
    const ok = screen.getByRole("button", { name: "Ya, tolak" });
    expect(ok).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Lainnya" }));
    expect(ok).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /alasan/i }), "Listrik mati");
    expect(ok).toBeEnabled();
    await user.click(ok);
    expect(onConfirm).toHaveBeenCalledWith("Listrik mati");
  });
  it("memilih alasan baku mengirim teks alasan itu", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<TestDialog requireReason reasons={["Stok habis"]} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Tolak" }));
    await user.click(screen.getByRole("radio", { name: "Stok habis" }));
    await user.click(screen.getByRole("button", { name: "Ya, tolak" }));
    expect(onConfirm).toHaveBeenCalledWith("Stok habis");
  });
  it("Esc menutup dan fokus kembali ke pembuka", async () => {
    const user = userEvent.setup();
    render(<TestDialog />);
    const opener = screen.getByRole("button", { name: "Tolak" });
    await user.click(opener);
    expect(screen.getByRole("dialog", { name: "Tolak pesanan?" })).toBeInTheDocument();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });
  it("memilih Lainnya memindahkan fokus ke kolom alasan", async () => {
    const user = userEvent.setup();
    render(<TestDialog requireReason reasons={["Stok habis"]} />);
    await user.click(screen.getByRole("button", { name: "Tolak" }));
    await user.click(screen.getByRole("radio", { name: "Lainnya" }));
    expect(screen.getByRole("textbox", { name: /alasan/i })).toHaveFocus();
  });
  it("Batal menutup tanpa memanggil onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<TestDialog onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Tolak" }));
    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
