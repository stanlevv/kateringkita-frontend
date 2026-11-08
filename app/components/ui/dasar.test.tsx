import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./Button";
import { Field } from "./Field";
import { Input } from "./Input";
import { PaymentBadge } from "./PaymentBadge";
import { StatusBadge } from "./StatusBadge";
import { ErrorSummary } from "./ErrorSummary";
import { Pagination } from "./Pagination";
import { DataTable } from "./DataTable";

describe("Button (G-3)", () => {
  it("loading -> disabled, aria-busy, teks loadingText", () => {
    render(<Button loading loadingText="Menyimpan…">Simpan</Button>);
    const b = screen.getByRole("button", { name: "Menyimpan…" });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute("aria-busy", "true");
  });
});

describe("Field (G-2)", () => {
  it("error -> input aria-invalid dan aria-describedby menunjuk teks error", () => {
    render(<Field label="Nama" error="Nama wajib diisi" help="Bantuan"><Input /></Field>);
    const input = screen.getByLabelText("Nama");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    const teks = ids.map((i) => document.getElementById(i)?.textContent);
    expect(teks).toContain("Nama wajib diisi");
    expect(teks).toContain("Bantuan");
  });
  it("tanpa error -> tidak aria-invalid", () => {
    render(<Field label="Nama"><Input /></Field>);
    expect(screen.getByLabelText("Nama")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Badge status (G-7)", () => {
  it("StatusBadge memakai peta order-status: tunai holding = Menunggu konfirmasi", () => {
    render(<StatusBadge order={{ status: "holding", payment_method: "cod", payment_status: "unpaid" }} />);
    expect(screen.getByText("Menunggu konfirmasi")).toBeInTheDocument();
  });
  it("PaymentBadge metode + status berupa teks", () => {
    render(<PaymentBadge method="va" status="expired" />);
    expect(screen.getByText("Virtual Account")).toBeInTheDocument();
    expect(screen.getByText("Kadaluarsa")).toBeInTheDocument();
  });
});

describe("ErrorSummary (G-2)", () => {
  it("role alert, daftar tautan ke field, fokus pindah ke ringkasan", () => {
    render(<ErrorSummary errors={[{ id: "nama", message: "Nama wajib diisi" }]} />);
    const a = screen.getByRole("alert");
    expect(a).toHaveFocus();
    expect(screen.getByText("Periksa isian berikut")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nama wajib diisi" })).toHaveAttribute("href", "#nama");
  });
  it("judul berupa heading dan tautan memindahkan fokus ke field", () => {
    render(<><ErrorSummary errors={[{ id: "nama", message: "Nama wajib diisi" }]} /><input id="nama" /></>);
    expect(screen.getByRole("heading", { name: "Periksa isian berikut" })).toBeInTheDocument();
    screen.getByRole("link", { name: "Nama wajib diisi" }).click();
    expect(document.getElementById("nama")).toHaveFocus();
  });
  it("render ulang dengan array errors baru tidak merebut fokus; focusKey baru memfokuskan", () => {
    const e = () => [{ id: "nama", message: "Nama wajib diisi" }];
    const { rerender } = render(<><ErrorSummary errors={e()} focusKey={1} /><input aria-label="x" /></>);
    const x = screen.getByLabelText("x");
    x.focus();
    rerender(<><ErrorSummary errors={e()} focusKey={1} /><input aria-label="x" /></>);
    expect(x).toHaveFocus();
    rerender(<><ErrorSummary errors={e()} focusKey={2} /><input aria-label="x" /></>);
    expect(screen.getByRole("alert")).toHaveFocus();
  });
  it("tanpa error -> tidak render", () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Pagination (G-1)", () => {
  it("menampilkan Halaman X dari Y dan tautan berikutnya", () => {
    render(<Pagination page={2} total={45} limit={20} hrefFor={(p) => `/x?page=${p}`} />);
    expect(screen.getByText("Halaman 2 dari 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Berikutnya" })).toHaveAttribute("href", "/x?page=3");
    expect(screen.getByRole("link", { name: "Sebelumnya" })).toHaveAttribute("href", "/x?page=1");
  });
  it("halaman pertama: Sebelumnya nonaktif", () => {
    render(<Pagination page={1} total={45} limit={20} hrefFor={(p) => `/x?page=${p}`} />);
    expect(screen.queryByRole("link", { name: "Sebelumnya" })).toBeNull();
    expect(screen.getByText("Sebelumnya")).toHaveAttribute("aria-disabled", "true");
  });
});

describe("DataTable", () => {
  it("render caption, header, baris; klik baris memanggil onRowClick", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        caption="Transaksi"
        rowKey={(r: { id: string; total: number }) => r.id}
        rows={[{ id: "a", total: 5000 }]}
        columns={[{ key: "id", header: "Kode", cell: (r) => r.id }, { key: "total", header: "Total", align: "right", cell: (r) => r.total }]}
        onRowClick={onRowClick}
      />,
    );
    expect(screen.getByRole("table", { name: "Transaksi" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
    screen.getByText("a").click();
    expect(onRowClick).toHaveBeenCalledWith({ id: "a", total: 5000 });
  });
  it("baris dapat difokus; Enter dan Spasi mengaktifkan; kontrol interaktif di sel diabaikan", () => {
    const onRowClick = vi.fn();
    const onBtn = vi.fn();
    render(
      <DataTable
        caption="Pesanan"
        rowKey={(r: { id: string }) => r.id}
        rows={[{ id: "a" }]}
        columns={[{ key: "id", header: "Kode", cell: (r) => r.id }, { key: "aksi", header: "Aksi", cell: () => <button onClick={onBtn}>Hapus</button> }]}
        onRowClick={onRowClick}
      />,
    );
    const baris = screen.getAllByRole("row")[1];
    expect(baris).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(baris, { key: "Enter" });
    fireEvent.keyDown(baris, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(2);
    const btn = screen.getByRole("button", { name: "Hapus" });
    fireEvent.click(btn);
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onBtn).toHaveBeenCalledOnce();
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
