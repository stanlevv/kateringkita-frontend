import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
const refresh = vi.fn();
let params = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, refresh }),
  usePathname: () => "/pesanan",
  useSearchParams: () => params,
}));
import { orders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { OrderTable } from "./OrderTable";

const allOrders = orders();
const renderTable = (list: MerchantOrder[] = allOrders, loadFailed = false, total = list.length) =>
  render(<OrderTable rows={list} total={total} loadFailed={loadFailed} />);
const table = () => screen.getByRole("table");
const lastUrl = () => String(replace.mock.calls.at(-1)?.[0]);

beforeEach(() => {
  replace.mockReset();
  push.mockReset();
  params = new URLSearchParams();
});

describe("PS-N1 tabel", () => {
  it("kolom dan baris dari server; item ringkas", () => {
    renderTable();
    for (const header of ["Kode", "Waktu", "Pemesan", "Item", "Total", "Pembayaran", "Status"])
      expect(within(table()).getByRole("columnheader", { name: header })).toBeInTheDocument();
    expect(within(table()).getByText("2× Nasi Ayam Bakar Madu, +1 lainnya")).toBeInTheDocument();
    expect(within(table()).getAllByRole("row")).toHaveLength(allOrders.length + 1);
  });
  it("klik baris dan Enter membuka detail", async () => {
    renderTable();
    const row = within(table()).getByText("Rafli Ramadhan").closest("tr") as HTMLElement;
    await userEvent.click(row);
    expect(push).toHaveBeenCalledWith("/pesanan/KK-20261031-7QF2");
    push.mockReset();
    row.focus();
    await userEvent.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/pesanan/KK-20261031-7QF2");
  });
});

describe("PS-N1/N3 filter dan halaman di URL", () => {
  it("ganti status menulis ?status= dan mengembalikan halaman ke 1", async () => {
    params = new URLSearchParams("page=2");
    renderTable();
    await userEvent.selectOptions(screen.getByLabelText("Status"), "completed");
    expect(lastUrl()).toBe("/pesanan?status=completed");
  });
  it("ganti tanggal menulis ?tanggal=", async () => {
    renderTable();
    fireEvent.change(screen.getByLabelText("Tanggal"), { target: { value: "2026-10-30" } });
    expect(lastUrl()).toContain("tanggal=2026-10-30");
  });
  it("kirim pencarian menulis ?q= tanpa mengubah filter lain", async () => {
    params = new URLSearchParams("status=holding&page=3");
    renderTable();
    await userEvent.type(screen.getByRole("searchbox", { name: "Cari kode atau nama" }), "salsa{Enter}");
    expect(lastUrl()).toBe("/pesanan?status=holding&q=salsa");
  });
  it("mengosongkan kotak cari (✕) menghapus q", async () => {
    params = new URLSearchParams("q=salsa&status=holding");
    renderTable();
    await userEvent.clear(screen.getByRole("searchbox", { name: "Cari kode atau nama" }));
    expect(lastUrl()).toBe("/pesanan?status=holding");
  });
  it("paginasi 20 per halaman dengan tautan ?page=; tabel tidak menyaring sendiri", () => {
    const pageRows = Array.from({ length: 20 }, (_, i) => ({
      ...allOrders[9],
      code: `KK-X-${i}`,
      created_at: new Date(Date.now() - i * 1000).toISOString(),
    }));
    params = new URLSearchParams("page=2&q=tidakcocok");
    renderTable(pageRows, false, 45);
    expect(within(table()).getAllByRole("row")).toHaveLength(21);
    expect(screen.getByText("Halaman 2 dari 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Berikutnya/ })).toHaveAttribute("href", "/pesanan?page=3&q=tidakcocok");
  });
});

describe("PS-S1 state", () => {
  it("hari ini belum ada pesanan", () => {
    renderTable([], false, 0);
    expect(screen.getByText("Belum ada pesanan hari ini")).toBeInTheDocument();
  });
  it("filter tanpa hasil: pesan + Hapus filter", async () => {
    params = new URLSearchParams("q=zzz");
    renderTable([], false, 0);
    expect(screen.getByText(/Tidak ada pesanan yang cocok/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(replace).toHaveBeenCalledWith("/pesanan", { scroll: false });
  });
  it("gagal muat", () => {
    renderTable([], true);
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});
