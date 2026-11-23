import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TableOrder } from "@/types/table";

const getTableOrderStatus = vi.fn();
vi.mock("@/app/actions/table", () => ({
  getTableOrderStatus: (...args: unknown[]) => getTableOrderStatus(...args),
  payTableOrder: vi.fn(),
}));

import { TableOrderStatus } from "./TableOrderStatus";

const buildOrder = (overrides: Partial<TableOrder> = {}): TableOrder => ({
  code: "KK-1",
  status: "holding",
  payment_status: "pending",
  table: { label: "5" },
  merchant: { slug: "dapur", business_name: "Dapur Siti" },
  customer_name: "Andi",
  note: null,
  items: [{ menu_id: 1, menu_name: "Nasi Ayam", qty: 2, unit_price: 15000, options: [], line_total: 30000 }],
  subtotal: 30000,
  service_fee: 0,
  total: 30000,
  hold_until: null,
  seconds_left: 125,
  payment_url: "https://snap/x",
  created_at: "",
  ...overrides,
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

describe("status pesanan meja", () => {
  it("tanpa token tamu di perangkat ini → tidak memanggil server", () => {
    render(<TableOrderStatus code="KK-1" />);
    expect(screen.getByText("Pesanan tidak bisa dibuka di sini")).toBeInTheDocument();
    expect(getTableOrderStatus).not.toHaveBeenCalled();
  });

  it("menunggu bayar: hitung mundur & tombol bayar; dikonfirmasi: langkah pembayaran tercentang", async () => {
    localStorage.setItem("kk-tamu:KK-1", JSON.stringify({ tamu: "tamu-1", meja: "t0k3n" }));
    getTableOrderStatus.mockResolvedValueOnce({ data: buildOrder() });
    const { unmount } = render(<TableOrderStatus code="KK-1" />);
    expect(await screen.findByText("Menunggu pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Bayar dalam 02:05")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bayar Rp 30.000" })).toBeInTheDocument();
    expect(getTableOrderStatus).toHaveBeenCalledWith("KK-1", "tamu-1");
    unmount();

    getTableOrderStatus.mockResolvedValueOnce({
      data: buildOrder({ status: "confirmed", payment_status: "paid", payment_url: null }),
    });
    render(<TableOrderStatus code="KK-1" />);
    expect(await screen.findByText("Pesanan diterima")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bayar/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tambah pesanan lain" })).toHaveAttribute("href", "/meja/t0k3n");
  });

  it("selesai: kelima langkah tercentang, tidak ada langkah bernomor", async () => {
    localStorage.setItem("kk-tamu:KK-1", JSON.stringify({ tamu: "tamu-1", meja: "t0k3n" }));
    getTableOrderStatus.mockResolvedValueOnce({
      data: buildOrder({ status: "completed", payment_status: "paid", payment_url: null }),
    });
    render(<TableOrderStatus code="KK-1" />);
    expect(await screen.findByText("Selamat menikmati")).toBeInTheDocument();
    for (const stepNumber of ["1", "2", "3", "4", "5"]) expect(screen.queryByText(stepNumber)).not.toBeInTheDocument();
  });
});
