// Test DashboardLive: aksi pesanan memakai respons server, pesanan baru dari polling, KPI konsisten dengan kartu,
// timer tahan, galat data (banner koneksi), dan kuota. Jam dipalsukan (vi.useFakeTimers) untuk menjalankan polling.
// Modul Next.js, server action, dan fetch dipalsukan (vi.mock/vi.stubGlobal) agar test tidak butuh server.
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getScenario = vi.fn();
const refresh = vi.fn();
vi.mock("@/lib/scenario", () => ({ getScenario: () => getScenario() }));
vi.mock("@/services/auth.service", () => ({ requireMerchant: async () => ({}) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: vi.fn() }));
const adjustQuota = vi.fn();
vi.mock("@/app/actions/menus", () => ({ adjustQuota: (...args: unknown[]) => adjustQuota(...args) }));
const orderAction = vi.fn();
vi.mock("@/app/actions/orders", () => ({ orderAction: (...args: unknown[]) => orderAction(...args) }));
import { StoreStatusProvider } from "@/app/components/shell/StoreStatus";
import { Toaster } from "@/app/components/ui/Toast";
import { formatTime, formatRupiah } from "@/lib/format";
import { menus } from "@/lib/fixtures/menus";
import { orders } from "@/lib/fixtures/orders";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { DashboardLive, type DashboardData } from "./DashboardLive";

const ORDER_CODE = "KK-20261031-7QF2";
const STORE = { isOpen: true, openTime: "00:00", closeTime: "23:59" };
const loadData = (): DashboardData => ({
  orders: orders(),
  menus: menus(),
  hasPickupPoints: true,
  loadedAt: Date.now(),
});
const dashboardTree = (data: DashboardData | null, loadFailed = false) => (
  <StoreStatusProvider store={STORE}>
    <Toaster />
    <DashboardLive data={data} loadFailed={loadFailed} />
  </StoreStatusProvider>
);
const card = () => within(screen.getByText(ORDER_CODE).closest("article") as HTMLElement);
const secondsLeft = () => {
  const [minutes, seconds] = (
    screen.getByText(ORDER_CODE).closest("article")!.querySelector("[data-timer]")!.textContent ?? ""
  )
    .match(/\d\d:\d\d/)![0]
    .split(":")
    .map(Number);
  return minutes * 60 + seconds;
};

const fetchMock = vi.fn();
const okResponse = (orders: MerchantOrder[] = [], menuList: MerchantMenu[] = menus()) =>
  ({
    ok: true,
    status: 200,
    redirected: false,
    url: "",
    json: async () => ({ data: { orders, menus: menuList } }),
  }) as unknown as Response;
const failedResponse = () =>
  ({ ok: false, status: 503, redirected: false, url: "", json: async () => ({}) }) as unknown as Response;
/** Majukan jam (palsu) dan biarkan fetch/aksi yang dipicu selesai. */
const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};
const kpi = (label: string) =>
  within(screen.getByRole("region", { name: "Ringkasan hari ini" })).getByText(label).nextElementSibling!;
const kpiNumber = (label: string) => Number(kpi(label).textContent!.replace(/\D/g, ""));
const newerVersion = (order: MerchantOrder, patch: Partial<MerchantOrder>): MerchantOrder => ({
  ...order,
  ...patch,
  updated_at: new Date(Date.now() + 1000).toISOString(),
});
const audio = vi.fn();
class FakeAudioContext {
  currentTime = 0;
  destination = {};
  constructor() {
    audio();
  }
  createOscillator() {
    return { frequency: {}, connect: (node: unknown) => node, start() {}, stop() {}, onended: null };
  }
  createGain() {
    return { gain: {}, connect: (node: unknown) => node };
  }
  close() {
    return Promise.resolve();
  }
}

let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  getScenario.mockResolvedValue(null);
  refresh.mockReset();
  orderAction.mockReset();
  adjustQuota.mockReset();
  fetchMock.mockReset().mockImplementation(async () => okResponse());
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  audio.mockReset();
  document.title = "Dashboard · KateringKita";
  try {
    localStorage.clear();
  } catch {
    /* abaikan */
  }
});
afterEach(() => {
  act(() => vi.runOnlyPendingTimers());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("aksi memakai baris dari respons", () => {
  it("Konfirmasi: optimistis, 5 dtk, 3 argumen; respons langsung tampil, sinkron segera, tanpa router.refresh", async () => {
    const data = loadData();
    const original = data.orders.find((order) => order.code === ORDER_CODE)!;
    orderAction.mockImplementation(async () => ({
      data: newerVersion(original, { status: "confirmed", confirmed_at: new Date().toISOString() }),
    }));
    render(dashboardTree(data));
    await user.click(card().getByRole("button", { name: "Konfirmasi" }));
    expect(card().getByText("Dikonfirmasi")).toBeInTheDocument();
    await advance(5100);
    expect(orderAction).toHaveBeenCalledWith(ORDER_CODE, "confirm", undefined);
    expect(card().getByRole("button", { name: "Mulai masak" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(2); // jadwal 5 dtk + segera setelah aksi
    // holding -> confirmed: angka Perlu tindakan tetap, jadi badge sidebar tidak perlu dimuat ulang
    expect(refresh).not.toHaveBeenCalled();
  });
  it("Tolak: angka Perlu tindakan turun -> router.refresh sekali (badge sidebar)", async () => {
    const data = loadData();
    const original = data.orders.find((order) => order.code === ORDER_CODE)!;
    orderAction.mockImplementation(async () => ({
      data: newerVersion(original, { status: "cancelled", cancelled_by: "merchant", cancel_reason: "Stok habis" }),
    }));
    render(dashboardTree(data));
    await user.click(card().getByRole("button", { name: "Tolak" }));
    const dialog = screen.getByRole("dialog", { name: /Tolak pesanan/ });
    await user.click(within(dialog).getByRole("radio", { name: "Stok habis" }));
    await user.click(within(dialog).getByRole("button", { name: "Tolak pesanan" }));
    await advance(0);
    expect(screen.queryByText(ORDER_CODE)).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("CONFLICT -> toast Pesanan sudah berubah status + sinkron segera", async () => {
    orderAction.mockResolvedValue({ error: { code: "CONFLICT", message: "Pesanan sudah berubah status" } });
    render(dashboardTree(loadData()));
    await user.click(card().getByRole("button", { name: "Konfirmasi" }));
    await advance(5100);
    expect(screen.getByRole("region", { name: "Pemberitahuan" })).toHaveTextContent("Pesanan sudah berubah status");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("Selesai: omzet hari ini naik seketika", async () => {
    const data = loadData();
    const readyOrder = data.orders.find((order) => order.status === "ready")!;
    orderAction.mockImplementation(async () => ({
      data: newerVersion(readyOrder, { status: "completed", completed_at: new Date().toISOString() }),
    }));
    render(dashboardTree(data));
    await user.click(screen.getByRole("tab", { name: /Siap diambil/ }));
    const before = kpiNumber("Omzet hari ini");
    await user.click(
      within(screen.getByText(readyOrder.code).closest("article") as HTMLElement).getByRole("button", {
        name: "Selesai",
      }),
    );
    await advance(5100);
    expect(kpi("Omzet hari ini")).toHaveTextContent(formatRupiah(before + readyOrder.total));
  });
});

describe("pesanan baru dari penyegaran", () => {
  const newOrder = (code: string): MerchantOrder => {
    const now = Date.now();
    return {
      ...orders()[0],
      code,
      status: "holding",
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
      hold_until: new Date(now + 300_000).toISOString(),
      seconds_left: 300,
    };
  };
  it("kartu teratas + badge Baru, angka tab naik, diumumkan, berbunyi", async () => {
    render(dashboardTree(loadData()));
    audio.mockClear();
    fetchMock.mockImplementationOnce(async () => okResponse([newOrder("KK-20261101-AAAA")]));
    await advance(5000);
    const first = screen.getAllByRole("article")[0];
    expect(first).toHaveTextContent("KK-20261101-AAAA");
    expect(first).toHaveAttribute("data-baru", "true");
    expect(within(first).getByText("Baru")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Perlu tindakan/ })).toHaveTextContent("5");
    expect(document.querySelector(".sr-only[aria-live=polite]")).toHaveTextContent("1 pesanan baru masuk");
    expect(audio).toHaveBeenCalled();
  });
  it("suara dimatikan -> tanpa bunyi; tab tersembunyi -> judul (1) Pesanan baru", async () => {
    localStorage.setItem("kk_suara", "0");
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    render(dashboardTree(loadData()));
    audio.mockClear();
    fetchMock.mockImplementation(async () => okResponse([newOrder("KK-20261101-BBBB")]));
    await advance(30_000);
    expect(screen.getByText("KK-20261101-BBBB")).toBeInTheDocument();
    expect(audio).not.toHaveBeenCalled();
    expect(document.title).toBe("(1) Pesanan baru · KateringKita");
  });
});

describe("angka konsisten dengan kartu", () => {
  it("penyegaran memindahkan ready -> completed: kartu hilang dari Siap diambil dan omzet naik di render yang sama", async () => {
    const data = loadData();
    const readyOrder = data.orders.find((order) => order.status === "ready")!;
    render(dashboardTree(data));
    await user.click(screen.getByRole("tab", { name: /Siap diambil/ }));
    const before = kpiNumber("Omzet hari ini");
    fetchMock.mockImplementationOnce(async () =>
      okResponse([newerVersion(readyOrder, { status: "completed", completed_at: new Date().toISOString() })]),
    );
    await advance(5000);
    expect(screen.queryByText(readyOrder.code)).toBeNull();
    expect(kpi("Omzet hari ini")).toHaveTextContent(formatRupiah(before + readyOrder.total));
  });
});

describe("waktu tahan", () => {
  it("sisa tahan menghitung mundur dari hold_until server", async () => {
    render(dashboardTree(loadData()));
    const initialSeconds = secondsLeft();
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(secondsLeft()).toBeLessThanOrEqual(initialSeconds - 9);
  });
  it("jam server 200 dtk lebih cepat -> sisa turun 200 dtk; < 60 dtk -> Segera", async () => {
    const data = loadData();
    const original = data.orders.find((order) => order.code === ORDER_CODE)!;
    render(dashboardTree(data));
    const initialSeconds = secondsLeft();
    fetchMock.mockImplementationOnce(async () => {
      const serverSecondsLeft = Math.round((Date.parse(original.hold_until!) - Date.now()) / 1000) - 200;
      return okResponse([{ ...original, seconds_left: serverSecondsLeft }]);
    });
    await advance(5000);
    expect(secondsLeft()).toBeLessThanOrEqual(initialSeconds - 200);
    expect(secondsLeft()).toBeGreaterThanOrEqual(initialSeconds - 208);
    expect(card().getByText(/Segera/)).toBeInTheDocument();
  });
});

describe("galat data", () => {
  it("belum ada data + galat -> layar gagal muat dengan Coba lagi", async () => {
    render(dashboardTree(null, true));
    expect(screen.getByText("Data dashboard belum bisa dimuat")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refresh).toHaveBeenCalled();
  });
  it("sudah ada data lalu halaman galat -> data terakhir tetap + banner, aksi tetap bisa", () => {
    const { rerender } = render(dashboardTree(loadData()));
    rerender(dashboardTree(null, true));
    expect(screen.getByText(/Koneksi terputus — data terakhir \d\d\.\d\d\. Mencoba lagi…/)).toBeInTheDocument();
    expect(card().getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
    expect(screen.queryByText("Data dashboard belum bisa dimuat")).toBeNull();
    rerender(dashboardTree(loadData()));
    expect(screen.queryByText(/Koneksi terputus/)).toBeNull();
  });
  it("galat halaman sekali (refresh gagal) -> banner hilang pada penyegaran sukses berikutnya", async () => {
    const { rerender } = render(dashboardTree(loadData()));
    rerender(dashboardTree(null, true));
    expect(screen.getByText(/Koneksi terputus/)).toBeInTheDocument();
    await advance(5000);
    expect(screen.queryByText(/Koneksi terputus/)).toBeNull();
  });
  it("penyegaran 503 -> banner dengan jam sinkron sukses terakhir, kartu & aksi tetap; sukses -> banner hilang", async () => {
    render(dashboardTree(loadData()));
    await advance(5000); // sukses
    const syncedTime = formatTime(new Date().toISOString());
    fetchMock.mockImplementation(async () => failedResponse());
    await advance(5000);
    expect(screen.getByText(`Koneksi terputus — data terakhir ${syncedTime}. Mencoba lagi…`)).toBeInTheDocument();
    expect(card().getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
    fetchMock.mockImplementation(async () => okResponse());
    await advance(10_000);
    expect(screen.queryByText(/Koneksi terputus/)).toBeNull();
  });
});

describe("kuota", () => {
  const updatedText = () => screen.getAllByText(/Diperbarui \d+ detik lalu/)[0];
  it("ubah kuota -> baris dari respons tampil tanpa router.refresh", async () => {
    const data = loadData();
    const menu = data.menus.find((item) => item.is_active)!;
    const saved = { ...menu, quota_today: menu.quota_today + 1, available: menu.available + 1 };
    adjustQuota.mockImplementation(async () => ({ data: saved }));
    // server sudah menyimpan: penyegaran berikutnya membawa menu yang sama dengan respons simpan
    fetchMock.mockImplementation(async () =>
      okResponse(
        [],
        data.menus.map((item) => (item.id === menu.id ? saved : item)),
      ),
    );
    render(dashboardTree(data));
    await user.click(screen.getAllByRole("button", { name: `Tambah Kuota ${menu.name}` })[0]);
    await advance(600);
    expect(adjustQuota).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1); // sinkron segera setelah kuota tersimpan
    expect(screen.getAllByRole("spinbutton", { name: `Kuota ${menu.name}` })[0]).toHaveValue(menu.quota_today + 1);
    await advance(5000);
    expect(screen.getAllByRole("spinbutton", { name: `Kuota ${menu.name}` })[0]).toHaveValue(menu.quota_today + 1);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("Diperbarui 0 detik lalu setelah sinkron sukses; bertambah saat penyegaran gagal", async () => {
    render(dashboardTree(loadData()));
    await advance(5000);
    expect(updatedText()).toHaveTextContent("Diperbarui 0 detik lalu");
    fetchMock.mockImplementation(async () => failedResponse());
    await advance(10_000);
    expect(updatedText()).toHaveTextContent("Diperbarui 10 detik lalu");
  });
});

describe("status dapur di luar jam buka", () => {
  it("saklar menyala di luar jam buka: banner menyebut pembeli belum bisa memesan", () => {
    vi.setSystemTime(new Date("2026-10-30T22:30:00Z")); // 05.30 WIB
    render(
      <StoreStatusProvider store={{ isOpen: true, openTime: "07:00", closeTime: "16:00" }}>
        <Toaster />
        <DashboardLive data={loadData()} loadFailed={false} />
      </StoreStatusProvider>,
    );
    expect(
      screen.getByText("Di luar jam buka (07.00–16.00) — pembeli belum bisa memesan sampai 07.00"),
    ).toBeInTheDocument();
  });
});

describe("badge chat di sidebar", () => {
  it("jumlah chat belum dibaca dari cek berkala berubah -> router.refresh sekali; nilai pertama tidak memicu", async () => {
    const withChats = (total: number) =>
      ({
        ...okResponse(),
        json: async () => ({ data: { orders: [], menus: menus(), unread_chats: total } }),
      }) as Response;
    fetchMock
      .mockImplementationOnce(async () => withChats(1))
      .mockImplementationOnce(async () => withChats(1))
      .mockImplementationOnce(async () => withChats(2));
    render(dashboardTree(loadData()));
    await advance(5000);
    await advance(5000);
    expect(refresh).not.toHaveBeenCalled();
    await advance(5000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
