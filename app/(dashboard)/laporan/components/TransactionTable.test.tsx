// Test TransactionTable: kolom dan baris, waktu selesai (WIB), paginasi lewat URL, keadaan kosong, dan unduh CSV
// (berhasil, gagal + Coba lagi, sesi habis, 400/401). fetch dan router dipalsukan.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
import { Toaster } from "@/app/components/ui/Toast";
import type { Transaction } from "@/types/report";
import { TransactionTable } from "./TransactionTable";

// 25 baris lokal: dua baris pertama satu pesanan dengan dua menu (kode berulang).
const allTransactions: Transaction[] = Array.from({ length: 25 }, (_, i) => ({
  code: `KK-20261031-${String(Math.max(i - 1, 0)).padStart(4, "0")}`,
  created_at: "2026-10-30T10:00:00.000Z",
  completed_at: "2026-10-31T04:42:00.000Z",
  customer_name: "Rafli",
  payment_method: "cod",
  menu_name: `Menu ${i}`,
  qty: 2,
  total: 44000,
  hpp_total: 28000,
  status: "completed",
}));
const renderTable = (overrides: Partial<Parameters<typeof TransactionTable>[0]> = {}) =>
  render(
    <>
      <Toaster />
      <TransactionTable
        rows={allTransactions.slice(0, 20)}
        total={allTransactions.length}
        page={1}
        startDate="2026-10-25"
        endDate="2026-10-31"
        {...overrides}
      />
    </>,
  );

afterEach(() => vi.unstubAllGlobals());

describe("LP-N3 buku transaksi", () => {
  it("kolom sesuai spesifikasi dan satu baris per transaksi", () => {
    renderTable();
    const table = screen.getByRole("table");
    for (const header of ["Kode", "Waktu", "Menu", "Qty", "Omzet", "HPP", "Laba", "Metode"])
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(21);
    expect(within(table).getAllByText(allTransactions[0].code)).toHaveLength(2);
  });
  it("kolom Waktu dari completed_at (WIB), bukan created_at", () => {
    renderTable();
    const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(firstRow).toHaveTextContent("11.42"); // 04:42 UTC; created_at 10:00 UTC = 17.00 WIB
    expect(firstRow).not.toHaveTextContent("17.00");
  });
  it("paginasi 20 per halaman lewat URL, laporan tetap di rentang yang sama", () => {
    renderTable();
    expect(allTransactions.length).toBeGreaterThan(20);
    expect(screen.getByRole("link", { name: /Berikutnya/ })).toHaveAttribute(
      "href",
      "/laporan?dari=2026-10-25&sampai=2026-10-31&page=2",
    );
    expect(screen.getByText(`Halaman 1 dari ${Math.ceil(allTransactions.length / 20)}`)).toBeInTheDocument();
  });
  it("LP-S1 tanpa transaksi -> pesan kosong, tombol unduh nonaktif", () => {
    renderTable({ rows: [], total: 0 });
    expect(screen.getByText("Belum ada transaksi di rentang ini")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unduh CSV" })).toBeDisabled();
  });
});

describe("LP-N4/E2 unduh CSV", () => {
  it("memanggil rute CSV dengan rentang", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response("kode\r\n", { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } }),
      );
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/laporan/csv?dari=2026-10-25&sampai=2026-10-31");
    clickSpy.mockRestore();
  });
  it("gagal -> toast galat dengan Coba lagi yang mengulang unduhan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("x", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect(await screen.findByText("Unduhan gagal. Periksa koneksi lalu coba lagi.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  const stubDownload = () => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    return vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  };
  it("200 berisi HTML (dialihkan ke halaman masuk) -> pesan sesi, tidak ada berkas tersimpan", async () => {
    const response = new Response("<html>masuk</html>", { status: 200, headers: { "content-type": "text/html" } });
    Object.defineProperty(response, "redirected", { value: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    const clickSpy = stubDownload();
    renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect(await screen.findByText("Sesi berakhir, silakan masuk lagi.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Masuk lagi" }));
    expect(push).toHaveBeenCalledWith("/login?next=%2Flaporan%3Fdari%3D2026-10-25%26sampai%3D2026-10-31");
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });
  it("HTML tanpa tanda redirect tetap ditolak (bukan text/csv)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html/>", { status: 200, headers: { "content-type": "text/html" } })),
    );
    const clickSpy = stubDownload();
    renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    await waitFor(() =>
      expect(screen.getAllByText("Unduhan gagal. Periksa koneksi lalu coba lagi.").length).toBeGreaterThan(0),
    );
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });
  it("400 -> pesan dari server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Rentang maksimal 92 hari." }, { status: 400 })),
    );
    renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect(await screen.findByText("Rentang maksimal 92 hari.")).toBeInTheDocument();
  });
  it("401 -> pesan sesi", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json({ message: "Sesi berakhir. Masuk lagi untuk mengunduh." }, { status: 401 })),
    );
    renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect((await screen.findAllByText("Sesi berakhir, silakan masuk lagi.")).length).toBeGreaterThan(0);
  });
});
