import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const orderAction = vi.fn();
const refresh = vi.fn();
const push = vi.fn();
vi.mock("@/app/actions/orders", () => ({ orderAction: (...a: unknown[]) => orderAction(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
import { Toaster } from "@/components/ui/Toast";
import { orders } from "@/lib/fixtures/orders";
import { OrderDetail } from "./OrderDetail";

const semua = orders();
const cari = (code: string) => semua.find((o) => o.code.endsWith(code))!;
const tampil = (code: string, aksi = true) => render(<><Toaster /><OrderDetail order={cari(code)} aksi={aksi} /></>);

beforeEach(() => {
  orderAction.mockReset();
  refresh.mockReset();
  push.mockReset();
});

describe("sinkron dengan server & tampilan", () => {
  it("selalu mengikuti prop: prop baru langsung tampil", () => {
    const lama = cari("C5RW");
    const { rerender } = render(<OrderDetail order={lama} />);
    expect(screen.getByRole("button", { name: "Mulai masak" })).toBeInTheDocument();
    const baru = { ...lama, status: "cooking" as const, cooking_at: new Date().toISOString(), updated_at: new Date(Date.parse(lama.updated_at) + 60000).toISOString() };
    rerender(<OrderDetail order={baru} />);
    expect(screen.getByRole("button", { name: "Siap diambil" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mulai masak" })).not.toBeInTheDocument();
  });
  it("diskon > 0 tampil dengan tanda minus", () => {
    render(<OrderDetail order={{ ...cari("C5RW"), discount: 2000, total: cari("C5RW").total - 2000 }} />);
    expect(screen.getByText(/−\s*Rp\s*2\.000/)).toBeInTheDocument();
  });
  it("waktu ambil menyertakan tanggal bila bukan hari pesan", () => {
    const o = cari("C5RW");
    render(<OrderDetail order={{ ...o, pickup_at: new Date(Date.parse(o.created_at) + 2 * 86400e3).toISOString() }} />);
    expect(screen.getByText(/Waktu ambil: \d+ \w+ \d{4} \d\d\.\d\d/)).toBeInTheDocument();
  });
  it("kadaluarsa tanpa pelaku: label tidak diulang", () => {
    const o = { ...cari("Q4XK"), cancelled_by: null, cancel_reason: null };
    render(<OrderDetail order={o} />);
    const t = screen.getByRole("list", { name: "Riwayat status" });
    expect(within(t).getAllByText("Kadaluarsa")).toHaveLength(1);
  });
});

describe("PS-N2 rincian", () => {
  it("rincian harga menjumlah untuk semua pesanan contoh", () => {
    for (const o of semua) expect(o.subtotal - o.discount + o.service_fee).toBe(o.total);
  });
  it("menampilkan pemesan, titik ambil, item + opsi, rincian harga, pembayaran, catatan", () => {
    tampil("7QF2");
    expect(screen.getByText("Rafli Ramadhan")).toBeInTheDocument();
    expect(screen.getByText(/0812-3456-7890/)).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.queryByText("Diskon")).not.toBeInTheDocument(); // diskon 0 disembunyikan
    expect(screen.getByText("Biaya layanan")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Tunai")).toBeInTheDocument();
    expect(screen.getByText(/Sambal dipisah/)).toBeInTheDocument();
    expect(screen.getByText(/Titik ambil/)).toBeInTheDocument();
  });
  it("garis waktu memuat tahap yang sudah dilalui", () => {
    tampil("E2HV"); // cooking
    const t = screen.getByRole("list", { name: "Riwayat status" });
    expect(within(t).getByText("Dipesan")).toBeInTheDocument();
    expect(within(t).getByText("Dikonfirmasi")).toBeInTheDocument();
    expect(within(t).getByText("Mulai dimasak")).toBeInTheDocument();
    expect(within(t).queryByText("Selesai")).not.toBeInTheDocument();
  });
});

describe("PS-A1 dibatalkan/kadaluarsa", () => {
  it.each([
    ["N2VH", "Dibatalkan oleh penjual", "Stok habis"],
    ["P3WJ", "Dibatalkan oleh pembeli", "Dibatalkan pembeli"],
    ["Q4XK", "Dibatalkan oleh sistem", "Batas waktu bayar habis"],
  ])("%s menampilkan %s dan alasan", (kode, teks, alasan) => {
    tampil(kode);
    const t = screen.getByRole("list", { name: "Riwayat status" });
    expect(within(t).getByText(teks)).toBeInTheDocument();
    expect(within(t).getByText(new RegExp(alasan))).toBeInTheDocument();
  });
});

describe("aksi di detail (sama dengan kartu)", () => {
  it("aksi utama langsung dikirim, toast sukses, muat ulang", async () => {
    orderAction.mockResolvedValue({ data: { ...cari("C5RW"), status: "cooking" } });
    tampil("C5RW"); // confirmed -> Mulai masak
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    expect(orderAction).toHaveBeenCalledWith("KK-20261031-C5RW", "cook", undefined);
    await waitFor(() => expect(screen.getByText("Pesanan KK-20261031-C5RW mulai dimasak")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
  });
  it("CONFLICT: toast memakai pesan dari server", async () => {
    orderAction.mockResolvedValue({ error: { code: "CONFLICT", message: "Batas waktu pesanan sudah habis." } });
    tampil("C5RW");
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    await waitFor(() => expect(screen.getByText("Batas waktu pesanan sudah habis.")).toBeInTheDocument());
  });
  it("setelah sukses tombol tetap terkunci sampai status pada prop berubah", async () => {
    orderAction.mockResolvedValue({ data: {} });
    const lama = cari("C5RW");
    const { rerender } = render(<><Toaster /><OrderDetail order={lama} /></>);
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /Memulai masak/ })).toBeDisabled();
    rerender(<><Toaster /><OrderDetail order={{ ...lama, status: "cooking" }} /></>);
    expect(screen.getByRole("button", { name: "Siap diambil" })).toBeEnabled();
  });
  it("Tolak lewat dialog alasan", async () => {
    orderAction.mockResolvedValue({ data: { ...cari("C5RW"), status: "cancelled", cancelled_by: "merchant", cancel_reason: "Stok habis" } });
    tampil("C5RW");
    await userEvent.click(screen.getByRole("button", { name: "Tolak" }));
    const dlg = screen.getByRole("dialog");
    await userEvent.click(within(dlg).getByLabelText("Stok habis"));
    await userEvent.click(within(dlg).getByRole("button", { name: "Tolak pesanan" }));
    await waitFor(() => expect(orderAction).toHaveBeenCalledWith("KK-20261031-C5RW", "reject", "Stok habis"));
  });
  it("Chat WA ada pada pesanan aktif", () => {
    tampil("C5RW");
    expect(screen.getByRole("link", { name: /Chat WA/ })).toHaveAttribute("href", "/pesanan/KK-20261031-C5RW/wa");
  });
  it("pesanan selesai/dibatalkan: tanpa tombol aksi", () => {
    for (const kode of ["J5SD", "N2VH"]) {
      const { unmount } = tampil(kode);
      expect(screen.queryByRole("button", { name: /Konfirmasi|Mulai masak|Siap diambil|Selesai|Tolak/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Chat WA/ })).not.toBeInTheDocument();
      unmount();
    }
  });
  it("OUT_OF_STOCK: dialog stok; Tambah kuota ke /menu?q=; Tolak pesanan membuka alasan", async () => {
    orderAction.mockResolvedValue({ error: { code: "OUT_OF_STOCK", message: "x" } });
    tampil("7QF2"); // holding tunai -> Konfirmasi
    await userEvent.click(screen.getByRole("button", { name: "Konfirmasi" }));
    const dlg = await screen.findByRole("dialog", { name: "Stok tidak cukup untuk pesanan ini" });
    expect(screen.queryByText("Gagal mengonfirmasi. Coba lagi.")).not.toBeInTheDocument();
    await userEvent.click(within(dlg).getByRole("button", { name: "Tambah kuota" }));
    expect(push).toHaveBeenCalledWith(`/menu?q=${encodeURIComponent(cari("7QF2").items[0].menu_name)}`);
    await userEvent.click(within(dlg).getByRole("button", { name: "Tolak pesanan" }));
    expect(await screen.findByRole("dialog", { name: "Tolak pesanan?" })).toBeInTheDocument();
  });
  it("galat lain: toast gagal", async () => {
    orderAction.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "x" } });
    tampil("C5RW");
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    await waitFor(() => expect(screen.getByText("Gagal memulai masak. Coba lagi.")).toBeInTheDocument());
  });
  it("aksi={false}: tanpa tombol aksi", () => {
    tampil("C5RW", false);
    expect(screen.queryByRole("button", { name: "Mulai masak" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tolak" })).not.toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
  });
});
