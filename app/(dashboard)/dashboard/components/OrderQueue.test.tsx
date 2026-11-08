import { useState } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderAction = vi.fn();
const onTerima = vi.fn();
const onSegarkan = vi.fn();
vi.mock("@/app/actions/orders", () => ({ orderAction: (...a: unknown[]) => orderAction(...a) }));
import { Toaster } from "@/app/components/ui/Toast";
import { ganti, terapkanOptimis, type Optimis } from "@/lib/dashboard";
import { menus } from "@/lib/fixtures/menus";
import { orders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { OrderQueue } from "./OrderQueue";

const KODE = "KK-20261031-7QF2"; // holding tunai, sisa ± 4 mnt
const MASAK = "KK-20261031-C5RW"; // confirmed
const kartuDari = (code: string) => screen.getByText(code).closest("article") as HTMLElement;
const region = () => screen.getByRole("region", { name: "Pemberitahuan" });
const dalam = (code: string) => within(kartuDari(code));

/** Induk tiruan: menyimpan entri optimistis seperti DashboardLive. */
function Induk({ list, sekarang, onFokusKuota }: { list: MerchantOrder[]; sekarang: number; onFokusKuota: (id?: number) => void }) {
  const [optimis, setOptimis] = useState<Optimis>({});
  return (
    <OrderQueue orders={terapkanOptimis(list, optimis)} menus={menus()} sekarang={sekarang} baru={[]} optimis={optimis}
      onOptimis={(c, v) => setOptimis((o) => ganti(o, c, v))} onFokusKuota={onFokusKuota} onTerima={onTerima} onSegarkan={onSegarkan} />
  );
}

let ue: ReturnType<typeof userEvent.setup>;
const pasang = (list = orders()) => {
  const onFokusKuota = vi.fn();
  const r = render(<><Toaster /><Induk list={list} sekarang={Date.now()} onFokusKuota={onFokusKuota} /></>);
  const ganti = (baru: MerchantOrder[]) => r.rerender(<><Toaster /><Induk list={baru} sekarang={Date.now()} onFokusKuota={onFokusKuota} /></>);
  return { onFokusKuota, ...r, list, ganti };
};
const terapkan = (code: string, status: MerchantOrder["status"]) => ({ data: { ...orders().find((o) => o.code === code)!, status } });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  orderAction.mockReset().mockResolvedValue(terapkan(KODE, "confirmed"));
  onTerima.mockReset();
  onSegarkan.mockReset();
});
afterEach(() => {
  act(() => vi.runOnlyPendingTimers());
  vi.useRealTimers();
});

describe("tab antrean (brief §3)", () => {
  it("Perlu tindakan menghitung holding + confirmed dan tampil pertama", () => {
    pasang();
    expect(screen.getByRole("tab", { name: /Perlu tindakan/ })).toHaveTextContent("5");
    expect(screen.getByRole("tab", { name: /Dimasak/ })).toHaveTextContent("2");
    expect(screen.getByRole("tab", { name: /Siap diambil/ })).toHaveTextContent("2");
    expect(screen.getAllByRole("article")).toHaveLength(5);
    // holding paling dekat kadaluarsa dulu: B4NZ (2 mnt) sebelum 7QF2 (4 mnt)
    const kode = screen.getAllByRole("article").map((a) => a.querySelector("[data-kode]")?.textContent);
    expect(kode.indexOf("KK-20261031-B4NZ")).toBeLessThan(kode.indexOf(KODE));
  });
  it("pindah ke tab Dimasak", async () => {
    pasang();
    await ue.click(screen.getByRole("tab", { name: /Dimasak/ }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});

describe("DB-A2 aksi optimistis dengan Batalkan 5 dtk (Review Focus 2)", () => {
  it("Konfirmasi -> kartu langsung Dikonfirmasi + toast Batalkan; Batalkan -> kembali, action tidak dipanggil", async () => {
    pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Konfirmasi" }));
    expect(region()).toHaveTextContent(`Pesanan ${KODE} dikonfirmasi`);
    expect(dalam(KODE).getByText("Dikonfirmasi")).toBeInTheDocument();
    expect(dalam(KODE).getByRole("button", { name: "Mulai masak" })).toBeDisabled(); // selama jendela Batalkan
    await ue.click(within(region()).getByRole("button", { name: "Batalkan" }));
    expect(dalam(KODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(orderAction).not.toHaveBeenCalled();
    expect(dalam(KODE).getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
  });
  it("Mulai masak -> kartu langsung pindah ke tab Dimasak", async () => {
    pasang();
    await ue.click(dalam(MASAK).getByRole("button", { name: "Mulai masak" }));
    expect(screen.queryByText(MASAK)).toBeNull();
    expect(screen.getByRole("tab", { name: /Dimasak/ })).toHaveTextContent("3");
    await ue.click(screen.getByRole("tab", { name: /Dimasak/ }));
    expect(dalam(MASAK).getByText("Dimasak")).toBeInTheDocument();
  });
  it("tunggu 5 dtk -> dipanggil sekali tanpa objek pesanan; baris respons diteruskan + sinkron segera (D10)", async () => {
    pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(orderAction).toHaveBeenCalledTimes(1);
    expect(orderAction.mock.calls[0]).toEqual([KODE, "confirm", undefined]);
    expect(onTerima).toHaveBeenCalledWith(expect.objectContaining({ code: KODE, status: "confirmed" }));
    expect(onSegarkan).toHaveBeenCalledTimes(1);
    expect(dalam(KODE).getByRole("button", { name: "Mulai masak" })).toBeEnabled();
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(orderAction).toHaveBeenCalledTimes(1);
  });
  it("data server baru (updated_at berubah) menggantikan tampilan optimistis (D14)", async () => {
    const { ganti: render2 } = pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => { vi.advanceTimersByTime(5000); });
    const asli = orders().find((o) => o.code === KODE)!;
    // server menjawab: tetap menunggu konfirmasi tetapi dengan updated_at baru -> objek server dipakai apa adanya
    render2(orders().map((o) => (o.code === KODE ? { ...asli, updated_at: new Date(Date.parse(asli.updated_at) + 60_000).toISOString() } : o)));
    expect(dalam(KODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
  });
  it("dilepas sebelum 5 dtk -> dipanggil sekali", async () => {
    const { unmount } = pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Konfirmasi" }));
    unmount();
    expect(orderAction).toHaveBeenCalledTimes(1);
  });
  it("sisa tahan <= 5 dtk -> dikirim langsung tanpa Batalkan", async () => {
    const list = orders();
    list[0] = { ...list[0], hold_until: new Date(Date.now() + 4000).toISOString() };
    pasang(list);
    await ue.click(dalam(KODE).getByRole("button", { name: "Konfirmasi" }));
    expect(orderAction).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect(within(region()).queryByRole("button", { name: "Batalkan" })).toBeNull();
    expect(region()).toHaveTextContent(`Pesanan ${KODE} dikonfirmasi`);
  });
});

describe("galat aksi: kartu kembali ke status semula", () => {
  const konfirmasiLalu = async (hasil: unknown) => {
    orderAction.mockResolvedValue(hasil);
    const fn = pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => { vi.advanceTimersByTime(5000); });
    return fn;
  };
  it("DB-E1 gagal -> toast Gagal mengonfirmasi, kartu kembali", async () => {
    await konfirmasiLalu({ error: { code: "INTERNAL_ERROR", message: "x" } });
    expect(region()).toHaveTextContent("Gagal mengonfirmasi. Coba lagi.");
    expect(dalam(KODE).getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
  });
  it("DB-E1 aksi melempar (jaringan putus) -> kartu kembali dan bisa diproses lagi", async () => {
    orderAction.mockRejectedValue(new Error("Failed to fetch"));
    pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(region()).toHaveTextContent("Gagal mengonfirmasi. Coba lagi.");
    expect(dalam(KODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
    expect(dalam(KODE).getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
  });
  it("DB-E2 CONFLICT -> toast Pesanan sudah berubah status + sinkron segera", async () => {
    await konfirmasiLalu({ error: { code: "CONFLICT", message: "Batas waktu pesanan sudah habis." } });
    expect(region()).toHaveTextContent("Batas waktu pesanan sudah habis.");
    expect(onSegarkan).toHaveBeenCalled();
    expect(onTerima).not.toHaveBeenCalled();
    expect(dalam(KODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
  });
  it("DB-E3 OUT_OF_STOCK -> dialog Tambah kuota / Tolak pesanan", async () => {
    const { onFokusKuota } = await konfirmasiLalu({ error: { code: "OUT_OF_STOCK", message: "x" } });
    const dlg = screen.getByRole("dialog", { name: "Stok tidak cukup untuk pesanan ini" });
    await ue.click(within(dlg).getByRole("button", { name: "Tambah kuota" }));
    expect(onFokusKuota).toHaveBeenCalledWith(orders()[0].items[0].menu_id);
  });
  it("DB-E3 Tolak pesanan dari dialog stok membuka dialog alasan", async () => {
    await konfirmasiLalu({ error: { code: "OUT_OF_STOCK", message: "x" } });
    await ue.click(screen.getByRole("button", { name: "Tolak pesanan" }));
    expect(screen.getByRole("dialog", { name: /Tolak pesanan/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Di luar jangkauan titik temu" })).toBeInTheDocument();
  });
});

describe("DB-A1 tolak dengan alasan wajib", () => {
  it("tombol Tolak nonaktif sampai alasan dipilih; mengirim alasan", async () => {
    orderAction.mockResolvedValue(terapkan(KODE, "cancelled"));
    pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Tolak" }));
    const dlg = screen.getByRole("dialog", { name: /Tolak pesanan/ });
    const kirim = within(dlg).getByRole("button", { name: "Tolak pesanan" });
    expect(kirim).toBeDisabled();
    await ue.click(within(dlg).getByRole("radio", { name: "Stok habis" }));
    await ue.click(kirim);
    expect(orderAction.mock.calls[0]).toEqual([KODE, "reject", "Stok habis"]);
    await act(async () => {});
    expect(region()).toHaveTextContent(`Pesanan ${KODE} ditolak`);
    expect(screen.queryByText(KODE)).toBeNull(); // keluar dari Perlu tindakan
  });
});

describe("DB-S2 antrean kosong", () => {
  it("EmptyState dengan Atur kuota", async () => {
    const { onFokusKuota } = pasang([]);
    expect(screen.getByText("Belum ada pesanan")).toBeInTheDocument();
    await ue.click(screen.getByRole("button", { name: "Atur kuota" }));
    expect(onFokusKuota).toHaveBeenCalled();
  });
});

describe("DB-N5 lihat slip", () => {
  it("membuka laci slip dengan rincian harga", async () => {
    pasang();
    await ue.click(dalam(KODE).getByRole("button", { name: "Lihat slip" }));
    const dlg = screen.getByRole("dialog", { name: `Slip ${KODE}` });
    expect(within(dlg).getByText("Subtotal")).toBeInTheDocument();
    expect(within(dlg).getByText("Total")).toBeInTheDocument();
  });
});
