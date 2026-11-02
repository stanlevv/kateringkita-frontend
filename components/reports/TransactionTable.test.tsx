import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
import { Toaster } from "@/components/ui/Toast";
import { transaksi } from "@/lib/fixtures/reports";
import { TransactionTable } from "./TransactionTable";

const semua = transaksi("2026-10-25", "2026-10-31");
const tampil = (o: Partial<Parameters<typeof TransactionTable>[0]> = {}) =>
  render(<><Toaster /><TransactionTable rows={semua.slice(0, 20)} total={semua.length} page={1} dari="2026-10-25" sampai="2026-10-31" {...o} /></>);

afterEach(() => vi.unstubAllGlobals());

describe("LP-N3 buku transaksi", () => {
  it("kolom sesuai spesifikasi dan satu baris per transaksi", () => {
    tampil();
    const t = screen.getByRole("table");
    for (const h of ["Kode", "Waktu", "Menu", "Qty", "Omzet", "HPP", "Laba", "Metode"]) expect(within(t).getByRole("columnheader", { name: h })).toBeInTheDocument();
    expect(within(t).getAllByRole("row")).toHaveLength(21);
    expect(within(t).getByText(semua[0].code)).toBeInTheDocument();
  });
  it("paginasi 20 per halaman lewat URL, laporan tetap di rentang yang sama", () => {
    tampil();
    expect(semua.length).toBeGreaterThan(20);
    expect(screen.getByRole("link", { name: /Berikutnya/ })).toHaveAttribute("href", "/laporan?dari=2026-10-25&sampai=2026-10-31&page=2");
    expect(screen.getByText(`Halaman 1 dari ${Math.ceil(semua.length / 20)}`)).toBeInTheDocument();
  });
  it("LP-S1 tanpa transaksi -> pesan kosong, tombol unduh nonaktif", () => {
    tampil({ rows: [], total: 0 });
    expect(screen.getByText("Belum ada transaksi di rentang ini")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unduh CSV" })).toBeDisabled();
  });
});

describe("LP-N4/E2 unduh CSV", () => {
  it("memanggil rute CSV dengan rentang", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("kode\r\n", { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } }));
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const klik = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    await waitFor(() => expect(klik).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/laporan/csv?dari=2026-10-25&sampai=2026-10-31");
    klik.mockRestore();
  });
  it("gagal -> toast galat dengan Coba lagi yang mengulang unduhan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("x", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect(await screen.findByText("Unduhan gagal. Periksa koneksi lalu coba lagi.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  const tanpaUnduhan = () => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    return vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  };
  it("200 berisi HTML (dialihkan ke halaman masuk) -> pesan sesi, tidak ada berkas tersimpan", async () => {
    const res = new Response("<html>masuk</html>", { status: 200, headers: { "content-type": "text/html" } });
    Object.defineProperty(res, "redirected", { value: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
    const klik = tanpaUnduhan();
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect(await screen.findByText("Sesi berakhir, silakan masuk lagi.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Masuk lagi" }));
    expect(push).toHaveBeenCalledWith("/login?next=%2Flaporan%3Fdari%3D2026-10-25%26sampai%3D2026-10-31");
    expect(klik).not.toHaveBeenCalled();
    klik.mockRestore();
  });
  it("HTML tanpa tanda redirect tetap ditolak (bukan text/csv)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html/>", { status: 200, headers: { "content-type": "text/html" } })));
    const klik = tanpaUnduhan();
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    await waitFor(() => expect(screen.getAllByText("Unduhan gagal. Periksa koneksi lalu coba lagi.").length).toBeGreaterThan(0));
    expect(klik).not.toHaveBeenCalled();
    klik.mockRestore();
  });
  it("400 -> pesan dari server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Rentang maksimal 92 hari." }, { status: 400 })));
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect(await screen.findByText("Rentang maksimal 92 hari.")).toBeInTheDocument();
  });
  it("401 -> pesan sesi", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Sesi berakhir. Masuk lagi untuk mengunduh." }, { status: 401 })));
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));
    expect((await screen.findAllByText("Sesi berakhir, silakan masuk lagi.")).length).toBeGreaterThan(0);
  });
});
