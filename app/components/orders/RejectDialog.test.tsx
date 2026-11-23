// Test RejectDialog: peringatan dana untuk pembayaran online yang lunas dan pilihan alasan untuk pesanan meja.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { orders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { RejectDialog } from "./RejectDialog";

const baseOrder = orders()[0]; // holding tunai, titik temu
const renderDialog = (patch: Partial<MerchantOrder>) =>
  render(<RejectDialog order={{ ...baseOrder, ...patch }} onClose={vi.fn()} onConfirm={vi.fn()} />);

describe("RejectDialog (DB-A1, F26)", () => {
  it("tunai: tanpa peringatan dana; alasan titik temu tersedia", () => {
    renderDialog({});
    expect(screen.queryByText(/lewat Midtrans/)).toBeNull();
    expect(screen.getByRole("radio", { name: "Di luar jangkauan titik temu" })).toBeInTheDocument();
  });
  it("VA/online sudah lunas: peringatan dana dikembalikan admin, dengan nominal", () => {
    renderDialog({ status: "confirmed", payment_method: "online", payment_status: "paid", total: 31_000 });
    expect(screen.getByText(/Pembeli sudah membayar Rp 31\.000 lewat Midtrans/)).toBeInTheDocument();
    expect(screen.getByText(/tidak masuk saldo pencairan toko/)).toBeInTheDocument();
  });
  it("belum lunas: tanpa peringatan", () => {
    renderDialog({ payment_method: "va", payment_status: "unpaid" });
    expect(screen.queryByText(/lewat Midtrans/)).toBeNull();
  });
  it("pesanan meja: alasan titik temu tidak ditawarkan", () => {
    renderDialog({ table: { id: 1, label: "A1" } as MerchantOrder["table"], pickup_point: null });
    expect(screen.queryByRole("radio", { name: "Di luar jangkauan titik temu" })).toBeNull();
    expect(screen.getByRole("radio", { name: "Stok habis" })).toBeInTheDocument();
  });
});
