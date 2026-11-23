// Test halaman /dashboard: KPI dari data nyata, sakelar suara, dan keadaan per skenario pratinjau (kosong, gagal
// muat, dapur tutup, luar jam, penjual baru, pesanan baru, offline).
// Data penjual dari backend ditiru dengan fixture lewat vi.mock pada services/api.
vi.mock("@/services/api", async (orig) => ({
  ...(await orig<typeof import("@/services/api")>()),
  merchantFetch: async (path: string) => ({
    ok: true,
    status: 200,
    data: path.startsWith("/orders")
      ? (await import("@/lib/fixtures/orders")).orders()
      : path === "/menus"
        ? (await import("@/lib/fixtures/menus")).menus()
        : (await import("@/lib/fixtures/profile")).profile(),
  }),
  apiFetch: async () => ({ ok: true, status: 200, data: (await import("@/lib/fixtures/meta")).pickupPoints() }),
}));
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getScenario = vi.fn();
const refresh = vi.fn();
const setStoreOpen = vi.fn();
vi.mock("@/lib/scenario", () => ({ getScenario: () => getScenario() }));
vi.mock("@/services/auth.service", () => ({
  requireMerchant: async () => ({ user: { full_name: "Diego" }, merchant: null }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }), usePathname: () => "/dashboard" }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: (...args: unknown[]) => setStoreOpen(...args) }));
vi.mock("@/app/actions/orders", () => ({ orderAction: vi.fn() }));
vi.mock("@/app/actions/menus", () => ({ adjustQuota: vi.fn() }));
import { StoreStatusProvider } from "@/app/components/shell/StoreStatus";
import { Toaster } from "@/app/components/ui/Toast";
import { getProfile } from "@/services/profile.service";
import { formatRupiah, wibDate } from "@/lib/format";
import { menus as fixtureMenus } from "@/lib/fixtures/menus";
import { orders as fixtureOrders } from "@/lib/fixtures/orders";
import DashboardPage from "./page";

async function renderPage(scenario: string | null) {
  getScenario.mockResolvedValue(scenario);
  const profileResult = await getProfile();
  const store =
    "data" in profileResult
      ? {
          isOpen: profileResult.data.is_open,
          openTime: profileResult.data.open_time,
          closeTime: profileResult.data.close_time,
        }
      : null;
  const page = await DashboardPage();
  return render(
    <StoreStatusProvider store={store}>
      <Toaster />
      {page}
    </StoreStatusProvider>,
  );
}

const kpi = (label: string) =>
  within(screen.getByRole("region", { name: "Ringkasan hari ini" })).getByText(label).nextElementSibling;

beforeEach(() => {
  // 1 Nov 2026 12.00 WIB: semua waktu fixture (relatif terhadap sekarang) jatuh di hari yang sama.
  vi.useFakeTimers({ toFake: ["Date"], now: Date.parse("2026-11-01T05:00:00.000Z") });
  refresh.mockReset();
  setStoreOpen.mockReset();
  document.title = "Dashboard · KateringKita";
  try {
    localStorage.clear();
  } catch {
    /* abaikan */
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Dashboard berisi (brief §3)", () => {
  it("KPI Perlu tindakan = jumlah tab Perlu tindakan", async () => {
    await renderPage(null);
    const tab = screen.getByRole("tab", { name: /Perlu tindakan/ });
    expect(tab).toHaveTextContent("4"); // VA belum lunas tidak dihitung
    expect(kpi("Perlu tindakan")).toHaveTextContent("4");
  });
  it("D2: KPI dihitung dari antrean & kuota nyata, bukan data contoh", async () => {
    await renderPage(null);
    const today = wibDate(new Date().toISOString());
    const revenue = fixtureOrders()
      .filter((order) => order.status === "completed" && wibDate(order.completed_at!) === today)
      .reduce((sum, order) => sum + order.total, 0);
    expect(revenue).toBeGreaterThan(0);
    expect(kpi("Omzet hari ini")).toHaveTextContent(formatRupiah(revenue));
    const activeMenus = fixtureMenus().filter((menu) => menu.is_active);
    const used = activeMenus.reduce((sum, menu) => sum + menu.sold_today + menu.held_today, 0);
    expect(kpi("Kapasitas terpakai")).toHaveTextContent(
      `${used}/${activeMenus.reduce((sum, menu) => sum + menu.quota_today, 0)}`,
    );
    expect(kpi("Rata-rata siap")).toHaveTextContent("24 menit");
    expect(screen.queryByText(/vs kemarin/)).toBeNull();
    expect(
      within(screen.getByRole("region", { name: "Menu terlaris hari ini" })).queryByText(
        "Belum ada penjualan hari ini.",
      ),
    ).toBeNull();
  });
  it("tanpa teks teknis", async () => {
    const { container } = await renderPage(null);
    expect(container.textContent).not.toMatch(/Redis|WebSocket|Timeout|Holding|Lab/);
  });
  it("sakelar suara: aria-pressed dan tersimpan", async () => {
    await renderPage(null);
    const soundButton = screen.getByRole("button", { name: "Suara notifikasi" });
    expect(soundButton).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(soundButton);
    expect(soundButton).toHaveAttribute("aria-pressed", "false");
    expect(localStorage.getItem("kk_suara")).toBe("0");
  });
});

describe("state brief §6 per skenario", () => {
  it("DB-S2 kosong -> antrean kosong + Atur kuota", async () => {
    await renderPage("kosong");
    expect(screen.getByText("Belum ada pesanan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atur kuota" })).toBeInTheDocument();
    expect(kpi("Omzet hari ini")).toHaveTextContent("Rp 0");
    expect(kpi("Kapasitas terpakai")).toHaveTextContent("0/0");
    expect(kpi("Rata-rata siap")).toHaveTextContent("—");
    expect(screen.getByText("Belum ada penjualan hari ini.")).toBeInTheDocument();
  });
  it("G-1 gagal-muat -> pesan + Coba lagi memuat ulang", async () => {
    await renderPage("gagal-muat");
    expect(screen.getByText("Data dashboard belum bisa dimuat")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refresh).toHaveBeenCalled();
  });
  it("DB-S5 dapur-tutup -> banner + Buka sekarang memakai status dapur bersama", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: true } });
    await renderPage("dapur-tutup");
    expect(screen.getByText("Dapur tutup — pembeli tidak bisa memesan")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Ringkasan hari ini" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Buka sekarang" }));
    expect(setStoreOpen).toHaveBeenCalledWith(true);
    await waitFor(() => expect(screen.queryByText("Dapur tutup — pembeli tidak bisa memesan")).toBeNull());
  });
  it("DB-S6 luar-jam -> banner jam buka + tautan Pengaturan", async () => {
    await renderPage("luar-jam");
    expect(screen.getByText(/Di luar jam buka \(\d\d\.\d\d–\d\d\.\d\d\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ubah jam buka" })).toHaveAttribute("href", "/pengaturan");
  });
  it("DB-A5 penjual-baru -> Siapkan toko dengan centang otomatis", async () => {
    await renderPage("penjual-baru");
    const card = screen.getByRole("region", { name: "Siapkan toko" });
    expect(within(card).getByRole("link", { name: /Lengkapi pengaturan/ })).toHaveAttribute(
      "href",
      "/pengaturan?lengkapi=titik-temu",
    );
    expect(within(card).getByRole("link", { name: /Tambah menu pertama/ })).toHaveAttribute("href", "/menu/baru");
    expect(
      within(card)
        .getByText(/Buka dapur/)
        .closest("li"),
    ).toHaveAttribute("data-selesai", "true");
    expect(
      within(card)
        .getByText(/Lengkapi pengaturan/)
        .closest("li"),
    ).toHaveAttribute("data-selesai", "false");
  });
  it("DB-A3 pesanan-baru -> kartu disorot di atas + judul tab (jendela tidak difokus) sampai difokus", async () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
    await renderPage("pesanan-baru");
    expect(screen.getAllByRole("article")[0]).toHaveTextContent("KK-20261031-S6ZA");
    const card = screen.getByText("KK-20261031-S6ZA").closest("article");
    expect(card).toHaveAttribute("data-baru", "true");
    expect(document.title).toBe("(1) Pesanan baru · KateringKita");
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(document.title).toBe("Dashboard · KateringKita");
  });
  it("DB-A3 jendela sedang difokus -> sorot tanpa mengubah judul tab", async () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    await renderPage("pesanan-baru");
    expect(screen.getByText("KK-20261031-S6ZA").closest("article")).toHaveAttribute("data-baru", "true");
    expect(document.title).toBe("Dashboard · KateringKita");
  });
  it("DB-E5 offline -> banner Koneksi terputus, aksi tetap ada", async () => {
    await renderPage(null);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/Koneksi terputus — data terakhir \d\d\.\d\d\. Mencoba lagi…/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Konfirmasi" })[0]).toBeEnabled();
  });
});
