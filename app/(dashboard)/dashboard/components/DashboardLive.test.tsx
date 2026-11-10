import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSkenario = vi.fn();
const refresh = vi.fn();
vi.mock("@/lib/skenario", () => ({ getSkenario: () => getSkenario() }));
vi.mock("@/services/authService", () => ({ requireMerchant: async () => ({}) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: vi.fn() }));
const adjustQuota = vi.fn();
vi.mock("@/app/actions/menus", () => ({ adjustQuota: (...a: unknown[]) => adjustQuota(...a) }));
const orderAction = vi.fn();
vi.mock("@/app/actions/orders", () => ({ orderAction: (...a: unknown[]) => orderAction(...a) }));
import { StoreStatusProvider } from "@/app/components/shell/StoreStatus";
import { Toaster } from "@/app/components/ui/Toast";
import { formatJam, formatRupiah } from "@/lib/format";
import { menus } from "@/lib/fixtures/menus";
import { orders } from "@/lib/fixtures/orders";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { DashboardLive, type DataDashboard } from "./DashboardLive";

const KODE = "KK-20261031-7QF2";
const STORE = { isOpen: true, buka: "00:00", tutup: "23:59" };
const muat = (): DataDashboard => ({ orders: orders(), menus: menus(), adaTitikTemu: true, dimuat: Date.now() });
const ui = (data: DataDashboard | null, galat = false) => (
  <StoreStatusProvider store={STORE}><Toaster /><DashboardLive data={data} galat={galat} /></StoreStatusProvider>
);
const kartu = () => within(screen.getByText(KODE).closest("article") as HTMLElement);
const detik = () => {
  const [m, s] = (screen.getByText(KODE).closest("article")!.querySelector("[data-timer]")!.textContent ?? "").match(/\d\d:\d\d/)![0].split(":").map(Number);
  return m * 60 + s;
};

const fetchMock = vi.fn();
const balas = (orders: MerchantOrder[] = [], m: MerchantMenu[] = menus()) =>
  ({ ok: true, status: 200, redirected: false, url: "", json: async () => ({ data: { orders, menus: m } }) }) as unknown as Response;
const gagal = () => ({ ok: false, status: 503, redirected: false, url: "", json: async () => ({}) }) as unknown as Response;
/** Majukan jam (palsu) dan biarkan fetch/aksi yang dipicu selesai. */
const maju = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const kpi = (label: string) => within(screen.getByRole("region", { name: "Ringkasan hari ini" })).getByText(label).nextElementSibling!;
const angka = (label: string) => Number(kpi(label).textContent!.replace(/\D/g, ""));
const lebihBaru = (o: MerchantOrder, p: Partial<MerchantOrder>): MerchantOrder => ({ ...o, ...p, updated_at: new Date(Date.now() + 1000).toISOString() });
const audio = vi.fn();
class AudioPalsu {
  currentTime = 0;
  destination = {};
  constructor() { audio(); }
  createOscillator() { return { frequency: {}, connect: (g: unknown) => g, start() {}, stop() {}, onended: null }; }
  createGain() { return { gain: {}, connect: (d: unknown) => d }; }
  close() { return Promise.resolve(); }
}

let ue: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  getSkenario.mockResolvedValue(null);
  refresh.mockReset();
  orderAction.mockReset();
  adjustQuota.mockReset();
  fetchMock.mockReset().mockImplementation(async () => balas());
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("AudioContext", AudioPalsu);
  audio.mockReset();
  document.title = "Dashboard · KateringKita";
  try { localStorage.clear(); } catch { /* abaikan */ }
});
afterEach(() => {
  act(() => vi.runOnlyPendingTimers());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});


describe("DB-N1 / D10 aksi memakai baris dari respons", () => {
  it("Konfirmasi: optimistis, 5 dtk, 3 argumen; respons langsung tampil, sinkron segera, tanpa router.refresh", async () => {
    const data = muat();
    const asli = data.orders.find((o) => o.code === KODE)!;
    orderAction.mockImplementation(async () => ({ data: lebihBaru(asli, { status: "confirmed", confirmed_at: new Date().toISOString() }) }));
    render(ui(data));
    await ue.click(kartu().getByRole("button", { name: "Konfirmasi" }));
    expect(kartu().getByText("Dikonfirmasi")).toBeInTheDocument();
    await maju(5100);
    expect(orderAction).toHaveBeenCalledWith(KODE, "confirm", undefined);
    expect(kartu().getByRole("button", { name: "Mulai masak" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(2); // jadwal 5 dtk + segera setelah aksi
    expect(refresh).not.toHaveBeenCalled(); // holding -> confirmed: angka Perlu tindakan tetap (D11)
  });
  it("Tolak: angka Perlu tindakan turun -> router.refresh sekali (badge sidebar)", async () => {
    const data = muat();
    const asli = data.orders.find((o) => o.code === KODE)!;
    orderAction.mockImplementation(async () => ({ data: lebihBaru(asli, { status: "cancelled", cancelled_by: "merchant", cancel_reason: "Stok habis" }) }));
    render(ui(data));
    await ue.click(kartu().getByRole("button", { name: "Tolak" }));
    const dlg = screen.getByRole("dialog", { name: /Tolak pesanan/ });
    await ue.click(within(dlg).getByRole("radio", { name: "Stok habis" }));
    await ue.click(within(dlg).getByRole("button", { name: "Tolak pesanan" }));
    await maju(0);
    expect(screen.queryByText(KODE)).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("CONFLICT -> toast Pesanan sudah berubah status + sinkron segera", async () => {
    orderAction.mockResolvedValue({ error: { code: "CONFLICT", message: "Pesanan sudah berubah status" } });
    render(ui(muat()));
    await ue.click(kartu().getByRole("button", { name: "Konfirmasi" }));
    await maju(5100);
    expect(screen.getByRole("region", { name: "Pemberitahuan" })).toHaveTextContent("Pesanan sudah berubah status");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("Selesai: omzet hari ini naik seketika", async () => {
    const data = muat();
    const siap = data.orders.find((o) => o.status === "ready")!;
    orderAction.mockImplementation(async () => ({ data: lebihBaru(siap, { status: "completed", completed_at: new Date().toISOString() }) }));
    render(ui(data));
    await ue.click(screen.getByRole("tab", { name: /Siap diambil/ }));
    const sebelum = angka("Omzet hari ini");
    await ue.click(within(screen.getByText(siap.code).closest("article") as HTMLElement).getByRole("button", { name: "Selesai" }));
    await maju(5100);
    expect(kpi("Omzet hari ini")).toHaveTextContent(formatRupiah(sebelum + siap.total));
  });
});

describe("DB-A3 pesanan baru dari penyegaran", () => {
  const baru = (code: string): MerchantOrder => {
    const t = Date.now();
    return { ...orders()[0], code, status: "holding", created_at: new Date(t).toISOString(), updated_at: new Date(t).toISOString(), hold_until: new Date(t + 300_000).toISOString(), seconds_left: 300 };
  };
  it("kartu teratas + badge Baru, angka tab naik, diumumkan, berbunyi", async () => {
    render(ui(muat()));
    audio.mockClear();
    fetchMock.mockImplementationOnce(async () => balas([baru("KK-20261101-AAAA")]));
    await maju(5000);
    const pertama = screen.getAllByRole("article")[0];
    expect(pertama).toHaveTextContent("KK-20261101-AAAA");
    expect(pertama).toHaveAttribute("data-baru", "true");
    expect(within(pertama).getByText("Baru")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Perlu tindakan/ })).toHaveTextContent("5");
    expect(document.querySelector(".sr-only[aria-live=polite]")).toHaveTextContent("1 pesanan baru masuk");
    expect(audio).toHaveBeenCalled();
  });
  it("suara dimatikan -> tanpa bunyi; tab tersembunyi -> judul (1) Pesanan baru", async () => {
    localStorage.setItem("kk_suara", "0");
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    render(ui(muat()));
    audio.mockClear();
    fetchMock.mockImplementation(async () => balas([baru("KK-20261101-BBBB")]));
    await maju(30_000);
    expect(screen.getByText("KK-20261101-BBBB")).toBeInTheDocument();
    expect(audio).not.toHaveBeenCalled();
    expect(document.title).toBe("(1) Pesanan baru · KateringKita");
  });
});

describe("D2 angka konsisten dengan kartu", () => {
  it("penyegaran memindahkan ready -> completed: kartu hilang dari Siap diambil dan omzet naik di render yang sama", async () => {
    const data = muat();
    const siap = data.orders.find((o) => o.status === "ready")!;
    render(ui(data));
    await ue.click(screen.getByRole("tab", { name: /Siap diambil/ }));
    const sebelum = angka("Omzet hari ini");
    fetchMock.mockImplementationOnce(async () => balas([lebihBaru(siap, { status: "completed", completed_at: new Date().toISOString() })]));
    await maju(5000);
    expect(screen.queryByText(siap.code)).toBeNull();
    expect(kpi("Omzet hari ini")).toHaveTextContent(formatRupiah(sebelum + siap.total));
  });
});

describe("waktu tahan", () => {
  it("sisa tahan menghitung mundur dari hold_until server", async () => {
    render(ui(muat()));
    const awal = detik();
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(detik()).toBeLessThanOrEqual(awal - 9);
  });
  it("D8 jam server 200 dtk lebih cepat -> sisa turun 200 dtk; < 60 dtk -> Segera", async () => {
    const data = muat();
    const asli = data.orders.find((o) => o.code === KODE)!;
    render(ui(data));
    const awal = detik();
    fetchMock.mockImplementationOnce(async () => {
      const sisaServer = Math.round((Date.parse(asli.hold_until!) - Date.now()) / 1000) - 200;
      return balas([{ ...asli, seconds_left: sisaServer }]);
    });
    await maju(5000);
    expect(detik()).toBeLessThanOrEqual(awal - 200);
    expect(detik()).toBeGreaterThanOrEqual(awal - 208);
    expect(kartu().getByText(/Segera/)).toBeInTheDocument();
  });
});

describe("galat data (G-1 / DB-E5)", () => {
  it("belum ada data + galat -> layar gagal muat dengan Coba lagi", async () => {
    render(ui(null, true));
    expect(screen.getByText("Data dashboard belum bisa dimuat")).toBeInTheDocument();
    await ue.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refresh).toHaveBeenCalled();
  });
  it("sudah ada data lalu halaman galat -> data terakhir tetap + banner, aksi tetap bisa", () => {
    const { rerender } = render(ui(muat()));
    rerender(ui(null, true));
    expect(screen.getByText(/Koneksi terputus — data terakhir \d\d\.\d\d\. Mencoba lagi…/)).toBeInTheDocument();
    expect(kartu().getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
    expect(screen.queryByText("Data dashboard belum bisa dimuat")).toBeNull();
    rerender(ui(muat()));
    expect(screen.queryByText(/Koneksi terputus/)).toBeNull();
  });
  it("galat halaman sekali (refresh gagal) -> banner hilang pada penyegaran sukses berikutnya", async () => {
    const { rerender } = render(ui(muat()));
    rerender(ui(null, true));
    expect(screen.getByText(/Koneksi terputus/)).toBeInTheDocument();
    await maju(5000);
    expect(screen.queryByText(/Koneksi terputus/)).toBeNull();
  });
  it("penyegaran 503 -> banner dengan jam sinkron sukses terakhir, kartu & aksi tetap; sukses -> banner hilang", async () => {
    render(ui(muat()));
    await maju(5000); // sukses
    const jam = formatJam(new Date().toISOString());
    fetchMock.mockImplementation(async () => gagal());
    await maju(5000);
    expect(screen.getByText(`Koneksi terputus — data terakhir ${jam}. Mencoba lagi…`)).toBeInTheDocument();
    expect(kartu().getByRole("button", { name: "Konfirmasi" })).toBeEnabled();
    fetchMock.mockImplementation(async () => balas());
    await maju(10_000);
    expect(screen.queryByText(/Koneksi terputus/)).toBeNull();
  });
});

describe("DB-N3 kuota", () => {
  const diperbarui = () => screen.getAllByText(/Diperbarui \d+ detik lalu/)[0];
  it("ubah kuota -> baris dari respons tampil tanpa router.refresh", async () => {
    const data = muat();
    const m = data.menus.find((x) => x.is_active)!;
    const simpan = { ...m, quota_today: m.quota_today + 1, available: m.available + 1 };
    adjustQuota.mockImplementation(async () => ({ data: simpan }));
    // server sudah menyimpan: penyegaran berikutnya membawa menu yang sama dengan respons simpan
    fetchMock.mockImplementation(async () => balas([], data.menus.map((x) => (x.id === m.id ? simpan : x))));
    render(ui(data));
    await ue.click(screen.getAllByRole("button", { name: `Tambah Kuota ${m.name}` })[0]);
    await maju(600);
    expect(adjustQuota).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1); // D10: sinkron segera setelah kuota tersimpan
    expect(screen.getAllByRole("spinbutton", { name: `Kuota ${m.name}` })[0]).toHaveValue(m.quota_today + 1);
    await maju(5000);
    expect(screen.getAllByRole("spinbutton", { name: `Kuota ${m.name}` })[0]).toHaveValue(m.quota_today + 1);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("Diperbarui 0 detik lalu setelah sinkron sukses; bertambah saat penyegaran gagal", async () => {
    render(ui(muat()));
    await maju(5000);
    expect(diperbarui()).toHaveTextContent("Diperbarui 0 detik lalu");
    fetchMock.mockImplementation(async () => gagal());
    await maju(10_000);
    expect(diperbarui()).toHaveTextContent("Diperbarui 10 detik lalu");
  });
});
