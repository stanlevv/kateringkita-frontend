// Test OrderQueue: tab antrean, aksi optimistis dengan Batalkan 5 detik, galat aksi, tolak dengan alasan,
// antrean kosong, dan laci slip. Server action orderAction dipalsukan (vi.mock); jam dipalsukan (vi.useFakeTimers).
import { useState } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderAction = vi.fn();
const onReceiveOrder = vi.fn();
const onRefresh = vi.fn();
vi.mock("@/app/actions/orders", () => ({ orderAction: (...args: unknown[]) => orderAction(...args) }));
import { Toaster } from "@/app/components/ui/Toast";
import { setOrDeleteKey, applyOptimisticActions, type OptimisticActions } from "@/lib/dashboard";
import { menus } from "@/lib/fixtures/menus";
import { orders } from "@/lib/fixtures/orders";
import type { MerchantOrder } from "@/types/order";
import { OrderQueue } from "./OrderQueue";

const HOLDING_CODE = "KK-20261031-7QF2"; // holding tunai, sisa ± 4 mnt
const CONFIRMED_CODE = "KK-20261031-C5RW"; // confirmed
const cardOf = (code: string) => screen.getByText(code).closest("article") as HTMLElement;
const region = () => screen.getByRole("region", { name: "Pemberitahuan" });
const inCard = (code: string) => within(cardOf(code));

/** Induk tiruan: menyimpan entri optimistis seperti DashboardLive. */
function TestParent({
  list,
  now,
  onFocusQuota,
}: {
  list: MerchantOrder[];
  now: number;
  onFocusQuota: (id?: number) => void;
}) {
  const [optimisticActions, setOptimisticActions] = useState<OptimisticActions>({});
  return (
    <OrderQueue
      orders={applyOptimisticActions(list, optimisticActions)}
      menus={menus()}
      now={now}
      newOrderCodes={[]}
      optimisticActions={optimisticActions}
      onOptimisticChange={(code, entry) => setOptimisticActions((previous) => setOrDeleteKey(previous, code, entry))}
      onFocusQuota={onFocusQuota}
      onReceiveOrder={onReceiveOrder}
      onRefresh={onRefresh}
    />
  );
}

let user: ReturnType<typeof userEvent.setup>;
const setup = (list = orders()) => {
  const onFocusQuota = vi.fn();
  const rendered = render(
    <>
      <Toaster />
      <TestParent list={list} now={Date.now()} onFocusQuota={onFocusQuota} />
    </>,
  );
  const rerenderWith = (nextList: MerchantOrder[]) =>
    rendered.rerender(
      <>
        <Toaster />
        <TestParent list={nextList} now={Date.now()} onFocusQuota={onFocusQuota} />
      </>,
    );
  return { onFocusQuota, ...rendered, list, rerenderWith };
};
const actionResult = (code: string, status: MerchantOrder["status"]) => ({
  data: { ...orders().find((order) => order.code === code)!, status },
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  orderAction.mockReset().mockResolvedValue(actionResult(HOLDING_CODE, "confirmed"));
  onReceiveOrder.mockReset();
  onRefresh.mockReset();
});
afterEach(() => {
  act(() => vi.runOnlyPendingTimers());
  vi.useRealTimers();
});

describe("tab antrean (brief §3)", () => {
  it("Perlu tindakan menghitung holding + confirmed dan tampil pertama", () => {
    setup();
    // K3MA (VA belum lunas) tetap tampil di daftar, tetapi tidak dihitung karena yang ditunggu adalah pembayaran pembeli
    expect(screen.getByRole("tab", { name: /Perlu tindakan/ })).toHaveTextContent("4");
    expect(screen.getByRole("tab", { name: /Dimasak/ })).toHaveTextContent("2");
    expect(screen.getByRole("tab", { name: /Siap diambil/ })).toHaveTextContent("2");
    expect(screen.getAllByRole("article")).toHaveLength(5);
    // holding paling dekat kadaluarsa dulu: B4NZ (2 mnt) sebelum 7QF2 (4 mnt)
    const codes = screen.getAllByRole("article").map((article) => article.querySelector("[data-kode]")?.textContent);
    expect(codes.indexOf("KK-20261031-B4NZ")).toBeLessThan(codes.indexOf(HOLDING_CODE));
  });
  it("pindah ke tab Dimasak", async () => {
    setup();
    await user.click(screen.getByRole("tab", { name: /Dimasak/ }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});

describe("DB-A2 aksi optimistis dengan Batalkan 5 dtk (Review Focus 2)", () => {
  it("Konfirmasi -> kartu langsung Dikonfirmasi + toast Batalkan; Batalkan -> kembali, action tidak dipanggil", async () => {
    setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" }));
    expect(region()).toHaveTextContent(`Pesanan ${HOLDING_CODE} dikonfirmasi`);
    expect(inCard(HOLDING_CODE).getByText("Dikonfirmasi")).toBeInTheDocument();
    expect(inCard(HOLDING_CODE).getByRole("button", { name: "Mulai masak" })).toBeDisabled(); // selama jendela Batalkan
    await user.click(within(region()).getByRole("button", { name: "Batalkan" }));
    expect(inCard(HOLDING_CODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(orderAction).not.toHaveBeenCalled();
    expect(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
  });
  it("Mulai masak -> kartu langsung pindah ke tab Dimasak", async () => {
    setup();
    await user.click(inCard(CONFIRMED_CODE).getByRole("button", { name: "Mulai masak" }));
    expect(screen.queryByText(CONFIRMED_CODE)).toBeNull();
    expect(screen.getByRole("tab", { name: /Dimasak/ })).toHaveTextContent("3");
    await user.click(screen.getByRole("tab", { name: /Dimasak/ }));
    expect(inCard(CONFIRMED_CODE).getByText("Dimasak")).toBeInTheDocument();
  });
  it("tunggu 5 dtk -> dipanggil sekali tanpa objek pesanan; baris respons diteruskan + sinkron segera (D10)", async () => {
    setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(orderAction).toHaveBeenCalledTimes(1);
    expect(orderAction.mock.calls[0]).toEqual([HOLDING_CODE, "confirm", undefined]);
    expect(onReceiveOrder).toHaveBeenCalledWith(expect.objectContaining({ code: HOLDING_CODE, status: "confirmed" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(inCard(HOLDING_CODE).getByRole("button", { name: "Mulai masak" })).toBeEnabled();
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(orderAction).toHaveBeenCalledTimes(1);
  });
  it("data server baru (updated_at berubah) menggantikan tampilan optimistis (D14)", async () => {
    const { rerenderWith } = setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    const original = orders().find((order) => order.code === HOLDING_CODE)!;
    // server menjawab: tetap menunggu konfirmasi tetapi dengan updated_at baru -> objek server dipakai apa adanya
    rerenderWith(
      orders().map((order) =>
        order.code === HOLDING_CODE
          ? { ...original, updated_at: new Date(Date.parse(original.updated_at) + 60_000).toISOString() }
          : order,
      ),
    );
    expect(inCard(HOLDING_CODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
  });
  it("dilepas sebelum 5 dtk -> dipanggil sekali", async () => {
    const { unmount } = setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" }));
    unmount();
    expect(orderAction).toHaveBeenCalledTimes(1);
  });
  it("sisa tahan <= 5 dtk -> dikirim langsung tanpa Batalkan", async () => {
    const list = orders();
    list[0] = { ...list[0], hold_until: new Date(Date.now() + 4000).toISOString() };
    setup(list);
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" }));
    expect(orderAction).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect(within(region()).queryByRole("button", { name: "Batalkan" })).toBeNull();
    expect(region()).toHaveTextContent(`Pesanan ${HOLDING_CODE} dikonfirmasi`);
  });
});

describe("galat aksi: kartu kembali ke status semula", () => {
  const confirmAndWait = async (result: unknown) => {
    orderAction.mockResolvedValue(result);
    const rendered = setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    return rendered;
  };
  it("DB-E1 gagal -> toast Gagal mengonfirmasi, kartu kembali", async () => {
    await confirmAndWait({ error: { code: "INTERNAL_ERROR", message: "x" } });
    expect(region()).toHaveTextContent("Gagal mengonfirmasi. Coba lagi.");
    expect(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
  });
  it("DB-E1 aksi melempar (jaringan putus) -> kartu kembali dan bisa diproses lagi", async () => {
    orderAction.mockRejectedValue(new Error("Failed to fetch"));
    setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" }));
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(region()).toHaveTextContent("Gagal mengonfirmasi. Coba lagi.");
    expect(inCard(HOLDING_CODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
    expect(inCard(HOLDING_CODE).getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
  });
  it("DB-E2 CONFLICT -> toast Pesanan sudah berubah status + sinkron segera", async () => {
    await confirmAndWait({ error: { code: "CONFLICT", message: "Batas waktu pesanan sudah habis." } });
    expect(region()).toHaveTextContent("Batas waktu pesanan sudah habis.");
    expect(onRefresh).toHaveBeenCalled();
    expect(onReceiveOrder).not.toHaveBeenCalled();
    expect(inCard(HOLDING_CODE).getByText("Menunggu konfirmasi")).toBeInTheDocument();
  });
  it("DB-E3 OUT_OF_STOCK -> dialog Tambah kuota / Tolak pesanan", async () => {
    const { onFocusQuota } = await confirmAndWait({ error: { code: "OUT_OF_STOCK", message: "x" } });
    const dialog = screen.getByRole("dialog", { name: "Stok tidak cukup untuk pesanan ini" });
    await user.click(within(dialog).getByRole("button", { name: "Tambah kuota" }));
    expect(onFocusQuota).toHaveBeenCalledWith(orders()[0].items[0].menu_id);
  });
  it("DB-E3 Tolak pesanan dari dialog stok membuka dialog alasan", async () => {
    await confirmAndWait({ error: { code: "OUT_OF_STOCK", message: "x" } });
    await user.click(screen.getByRole("button", { name: "Tolak pesanan" }));
    expect(screen.getByRole("dialog", { name: /Tolak pesanan/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Di luar jangkauan titik temu" })).toBeInTheDocument();
  });
});

describe("DB-A1 tolak dengan alasan wajib", () => {
  it("tombol Tolak nonaktif sampai alasan dipilih; mengirim alasan", async () => {
    orderAction.mockResolvedValue(actionResult(HOLDING_CODE, "cancelled"));
    setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Tolak" }));
    const dialog = screen.getByRole("dialog", { name: /Tolak pesanan/ });
    const submitButton = within(dialog).getByRole("button", { name: "Tolak pesanan" });
    expect(submitButton).toBeDisabled();
    await user.click(within(dialog).getByRole("radio", { name: "Stok habis" }));
    await user.click(submitButton);
    expect(orderAction.mock.calls[0]).toEqual([HOLDING_CODE, "reject", "Stok habis"]);
    await act(async () => {});
    expect(region()).toHaveTextContent(`Pesanan ${HOLDING_CODE} ditolak`);
    expect(screen.queryByText(HOLDING_CODE)).toBeNull(); // keluar dari Perlu tindakan
  });
});

describe("DB-S2 antrean kosong", () => {
  it("EmptyState dengan Atur kuota", async () => {
    const { onFocusQuota } = setup([]);
    expect(screen.getByText("Belum ada pesanan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Atur kuota" }));
    expect(onFocusQuota).toHaveBeenCalled();
  });
});

describe("DB-N5 lihat slip", () => {
  it("membuka laci slip dengan rincian harga", async () => {
    setup();
    await user.click(inCard(HOLDING_CODE).getByRole("button", { name: "Lihat slip" }));
    const dialog = screen.getByRole("dialog", { name: `Slip ${HOLDING_CODE}` });
    expect(within(dialog).getByText("Subtotal")).toBeInTheDocument();
    expect(within(dialog).getByText("Total")).toBeInTheDocument();
  });
});
