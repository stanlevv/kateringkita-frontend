// Test komponen dasar: Button, Field, StatusBadge, PaymentBadge, ErrorSummary, Pagination, DataTable.
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
    render(
      <Button loading loadingText="Menyimpan…">
        Simpan
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Menyimpan…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("Field (G-2)", () => {
  it("error -> input aria-invalid dan aria-describedby menunjuk teks error", () => {
    render(
      <Field label="Nama" error="Nama wajib diisi" help="Bantuan">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Nama");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toContain("Nama wajib diisi");
    expect(texts).toContain("Bantuan");
  });
  it("tanpa error -> tidak aria-invalid", () => {
    render(
      <Field label="Nama">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Nama")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Badge status (G-7)", () => {
  it("StatusBadge memakai peta order-status: tunai holding = Menunggu konfirmasi", () => {
    render(<StatusBadge order={{ status: "holding", payment_method: "cod", payment_status: "unpaid" }} />);
    expect(screen.getByText("Menunggu konfirmasi")).toBeInTheDocument();
  });
  it("PaymentBadge metode + status berupa teks", () => {
    render(<PaymentBadge method="va" status="pending" />);
    expect(screen.getByText("Virtual Account")).toBeInTheDocument();
    expect(screen.getByText("Menunggu verifikasi")).toBeInTheDocument();
  });
});

describe("ErrorSummary (G-2)", () => {
  it("role alert, daftar tautan ke field, fokus pindah ke ringkasan", () => {
    render(<ErrorSummary errors={[{ id: "nama", message: "Nama wajib diisi" }]} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveFocus();
    expect(screen.getByText("Periksa isian berikut")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nama wajib diisi" })).toHaveAttribute("href", "#nama");
  });
  it("judul berupa heading dan tautan memindahkan fokus ke field", () => {
    render(
      <>
        <ErrorSummary errors={[{ id: "nama", message: "Nama wajib diisi" }]} />
        <input id="nama" />
      </>,
    );
    expect(screen.getByRole("heading", { name: "Periksa isian berikut" })).toBeInTheDocument();
    screen.getByRole("link", { name: "Nama wajib diisi" }).click();
    expect(document.getElementById("nama")).toHaveFocus();
  });
  it("render ulang dengan array errors baru tidak merebut fokus; focusKey baru memfokuskan", () => {
    const buildErrors = () => [{ id: "nama", message: "Nama wajib diisi" }];
    const { rerender } = render(
      <>
        <ErrorSummary errors={buildErrors()} focusKey={1} />
        <input aria-label="x" />
      </>,
    );
    const otherInput = screen.getByLabelText("x");
    otherInput.focus();
    rerender(
      <>
        <ErrorSummary errors={buildErrors()} focusKey={1} />
        <input aria-label="x" />
      </>,
    );
    expect(otherInput).toHaveFocus();
    rerender(
      <>
        <ErrorSummary errors={buildErrors()} focusKey={2} />
        <input aria-label="x" />
      </>,
    );
    expect(screen.getByRole("alert")).toHaveFocus();
  });
  it("tanpa error -> tidak render", () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Pagination (G-1)", () => {
  it("menampilkan Halaman X dari Y dan tautan berikutnya", () => {
    render(<Pagination page={2} total={45} limit={20} hrefFor={(pageNumber) => `/x?page=${pageNumber}`} />);
    expect(screen.getByText("Halaman 2 dari 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Berikutnya" })).toHaveAttribute("href", "/x?page=3");
    expect(screen.getByRole("link", { name: "Sebelumnya" })).toHaveAttribute("href", "/x?page=1");
  });
  it("halaman pertama: Sebelumnya nonaktif", () => {
    render(<Pagination page={1} total={45} limit={20} hrefFor={(pageNumber) => `/x?page=${pageNumber}`} />);
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
        rowKey={(row: { id: string; total: number }) => row.id}
        rows={[{ id: "a", total: 5000 }]}
        columns={[
          { key: "id", header: "Kode", cell: (row) => row.id },
          { key: "total", header: "Total", align: "right", cell: (row) => row.total },
        ]}
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
    const onDeleteClick = vi.fn();
    render(
      <DataTable
        caption="Pesanan"
        rowKey={(row: { id: string }) => row.id}
        rows={[{ id: "a" }]}
        columns={[
          { key: "id", header: "Kode", cell: (row) => row.id },
          { key: "aksi", header: "Aksi", cell: () => <button onClick={onDeleteClick}>Hapus</button> },
        ]}
        onRowClick={onRowClick}
      />,
    );
    const dataRow = screen.getAllByRole("row")[1];
    expect(dataRow).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(dataRow, { key: "Enter" });
    fireEvent.keyDown(dataRow, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(2);
    const deleteButton = screen.getByRole("button", { name: "Hapus" });
    fireEvent.click(deleteButton);
    fireEvent.keyDown(deleteButton, { key: "Enter" });
    expect(onDeleteClick).toHaveBeenCalledOnce();
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
