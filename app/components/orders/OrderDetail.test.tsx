// Test OrderDetail: selalu mengikuti prop, rincian harga, riwayat status, dan aksi di detail (sukses, galat, tolak,
// stok tidak cukup). Server action dan router dipalsukan (vi.mock).
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const orderAction = vi.fn();
const refresh = vi.fn();
const push = vi.fn();
vi.mock("@/app/actions/orders", () => ({ orderAction: (...args: unknown[]) => orderAction(...args) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
import { Toaster } from "@/app/components/ui/Toast";
import { orders } from "@/lib/fixtures/orders";
import { OrderDetail } from "./OrderDetail";

const allOrders = orders();
const findOrder = (code: string) => allOrders.find((order) => order.code.endsWith(code))!;
const renderDetail = (code: string, showActions = true) =>
  render(
    <>
      <Toaster />
      <OrderDetail order={findOrder(code)} showActions={showActions} />
    </>,
  );

beforeEach(() => {
  orderAction.mockReset();
  refresh.mockReset();
  push.mockReset();
});

describe("sinkron dengan server & tampilan", () => {
  it("selalu mengikuti prop: prop baru langsung tampil", () => {
    const before = findOrder("C5RW");
    const { rerender } = render(<OrderDetail order={before} />);
    expect(screen.getByRole("button", { name: "Mulai masak" })).toBeInTheDocument();
    const after = {
      ...before,
      status: "cooking" as const,
      cooking_at: new Date().toISOString(),
      updated_at: new Date(Date.parse(before.updated_at) + 60000).toISOString(),
    };
    rerender(<OrderDetail order={after} />);
    expect(screen.getByRole("button", { name: "Siap diambil" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mulai masak" })).not.toBeInTheDocument();
  });
  it("diskon > 0 tampil dengan tanda minus", () => {
    render(<OrderDetail order={{ ...findOrder("C5RW"), discount: 2000, total: findOrder("C5RW").total - 2000 }} />);
    expect(screen.getByText(/−\s*Rp\s*2\.000/)).toBeInTheDocument();
  });
  it("waktu ambil menyertakan tanggal bila bukan hari pesan", () => {
    const order = findOrder("C5RW");
    render(
      <OrderDetail
        order={{ ...order, pickup_at: new Date(Date.parse(order.created_at) + 2 * 86400e3).toISOString() }}
      />,
    );
    expect(screen.getByText(/Waktu ambil: \d+ \w+ \d{4} \d\d\.\d\d/)).toBeInTheDocument();
  });
  it("kadaluarsa tanpa pelaku: label tidak diulang", () => {
    const order = { ...findOrder("Q4XK"), cancelled_by: null, cancel_reason: null };
    render(<OrderDetail order={order} />);
    const timeline = screen.getByRole("list", { name: "Riwayat status" });
    expect(within(timeline).getAllByText("Kadaluarsa")).toHaveLength(1);
  });
});

describe("rincian", () => {
  it("rincian harga menjumlah untuk semua pesanan contoh", () => {
    for (const order of allOrders) expect(order.subtotal - order.discount + order.service_fee).toBe(order.total);
  });
  it("menampilkan pemesan, titik ambil, item + opsi, rincian harga, pembayaran, catatan", () => {
    renderDetail("7QF2");
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
  it("pesanan meja: tombol & riwayat memakai 'Siap diantar'", () => {
    const cooking = { ...findOrder("E2HV"), table: { id: 1, label: "5" } };
    const { rerender } = render(<OrderDetail order={cooking} />);
    expect(screen.getByRole("button", { name: "Siap diantar" })).toBeInTheDocument();
    const ready = {
      ...cooking,
      status: "ready" as const,
      ready_at: new Date().toISOString(),
      updated_at: new Date(Date.parse(cooking.updated_at) + 60000).toISOString(),
    };
    rerender(<OrderDetail order={ready} />);
    const timeline = screen.getByRole("list", { name: "Riwayat status" });
    expect(within(timeline).getByText("Siap diantar")).toBeInTheDocument();
    expect(screen.queryByText("Siap diambil")).not.toBeInTheDocument();
  });
  it("garis waktu memuat tahap yang sudah dilalui", () => {
    renderDetail("E2HV"); // cooking
    const timeline = screen.getByRole("list", { name: "Riwayat status" });
    expect(within(timeline).getByText("Dipesan")).toBeInTheDocument();
    expect(within(timeline).getByText("Dikonfirmasi")).toBeInTheDocument();
    expect(within(timeline).getByText("Mulai dimasak")).toBeInTheDocument();
    expect(within(timeline).queryByText("Selesai")).not.toBeInTheDocument();
  });
});

describe("dibatalkan/kadaluarsa", () => {
  it.each([
    ["N2VH", "Dibatalkan oleh penjual", "Stok habis"],
    ["P3WJ", "Dibatalkan oleh pembeli", "Dibatalkan pembeli"],
    ["Q4XK", "Dibatalkan oleh sistem", "Batas waktu bayar habis"],
  ])("%s menampilkan %s dan alasan", (code, label, reason) => {
    renderDetail(code);
    const timeline = screen.getByRole("list", { name: "Riwayat status" });
    expect(within(timeline).getByText(label)).toBeInTheDocument();
    expect(within(timeline).getByText(new RegExp(reason))).toBeInTheDocument();
  });
});

describe("aksi di detail (sama dengan kartu)", () => {
  it("aksi utama langsung dikirim, toast sukses, muat ulang", async () => {
    orderAction.mockResolvedValue({ data: { ...findOrder("C5RW"), status: "cooking" } });
    renderDetail("C5RW"); // confirmed -> Mulai masak
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    expect(orderAction).toHaveBeenCalledWith("KK-20261031-C5RW", "cook", undefined);
    await waitFor(() => expect(screen.getByText("Pesanan KK-20261031-C5RW mulai dimasak")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
  });
  it("CONFLICT: toast memakai pesan dari server", async () => {
    orderAction.mockResolvedValue({ error: { code: "CONFLICT", message: "Batas waktu pesanan sudah habis." } });
    renderDetail("C5RW");
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    await waitFor(() => expect(screen.getByText("Batas waktu pesanan sudah habis.")).toBeInTheDocument());
  });
  it("setelah sukses tombol tetap terkunci sampai status pada prop berubah", async () => {
    orderAction.mockResolvedValue({ data: {} });
    const before = findOrder("C5RW");
    const { rerender } = render(
      <>
        <Toaster />
        <OrderDetail order={before} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /Memulai masak/ })).toBeDisabled();
    rerender(
      <>
        <Toaster />
        <OrderDetail order={{ ...before, status: "cooking" }} />
      </>,
    );
    expect(screen.getByRole("button", { name: "Siap diambil" })).toBeEnabled();
  });
  it("Tolak lewat dialog alasan", async () => {
    orderAction.mockResolvedValue({
      data: { ...findOrder("C5RW"), status: "cancelled", cancelled_by: "merchant", cancel_reason: "Stok habis" },
    });
    renderDetail("C5RW");
    await userEvent.click(screen.getByRole("button", { name: "Tolak" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByLabelText("Stok habis"));
    await userEvent.click(within(dialog).getByRole("button", { name: "Tolak pesanan" }));
    await waitFor(() => expect(orderAction).toHaveBeenCalledWith("KK-20261031-C5RW", "reject", "Stok habis"));
  });
  it("Chat WA ada pada pesanan aktif", () => {
    renderDetail("C5RW");
    expect(screen.getByRole("link", { name: /Chat WA/ })).toHaveAttribute("href", "/api/pesanan/KK-20261031-C5RW/wa");
  });
  it("pesanan selesai/dibatalkan: tanpa tombol aksi", () => {
    for (const code of ["J5SD", "N2VH"]) {
      const { unmount } = renderDetail(code);
      expect(
        screen.queryByRole("button", { name: /Konfirmasi|Mulai masak|Siap diambil|Selesai|Tolak/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Chat WA/ })).not.toBeInTheDocument();
      unmount();
    }
  });
  it("OUT_OF_STOCK: dialog stok; Tambah kuota ke /menu?q=; Tolak pesanan membuka alasan", async () => {
    orderAction.mockResolvedValue({ error: { code: "OUT_OF_STOCK", message: "x" } });
    renderDetail("7QF2"); // holding tunai -> Konfirmasi
    await userEvent.click(screen.getByRole("button", { name: "Konfirmasi" }));
    const dialog = await screen.findByRole("dialog", { name: "Stok tidak cukup untuk pesanan ini" });
    expect(screen.queryByText("Gagal mengonfirmasi. Coba lagi.")).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tambah kuota" }));
    expect(push).toHaveBeenCalledWith(`/menu?q=${encodeURIComponent(findOrder("7QF2").items[0].menu_name)}`);
    await userEvent.click(within(dialog).getByRole("button", { name: "Tolak pesanan" }));
    expect(await screen.findByRole("dialog", { name: "Tolak pesanan?" })).toBeInTheDocument();
  });
  it("galat lain: toast gagal", async () => {
    orderAction.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "x" } });
    renderDetail("C5RW");
    await userEvent.click(screen.getByRole("button", { name: "Mulai masak" }));
    await waitFor(() => expect(screen.getByText("Gagal memulai masak. Coba lagi.")).toBeInTheDocument());
  });
  it("aksi={false}: tanpa tombol aksi", () => {
    renderDetail("C5RW", false);
    expect(screen.queryByRole("button", { name: "Mulai masak" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tolak" })).not.toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
  });
});
