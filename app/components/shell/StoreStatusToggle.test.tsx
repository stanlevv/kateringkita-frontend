import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setStoreOpen = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/store", () => ({ setStoreOpen: (...args: unknown[]) => setStoreOpen(...args) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ refresh }) }));
import { Toaster } from "@/app/components/ui/Toast";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { StoreStatusProvider } from "./StoreStatus";
import { StoreStatusToggle } from "./StoreStatusToggle";

const INFO = { isOpen: true, openTime: "07:00", closeTime: "16:00" };
const kitchenSwitch = () => screen.getByRole("switch", { name: /Status dapur/ });
const renderWithStore = (content: React.ReactNode, store = INFO) =>
  render(<StoreStatusProvider store={store}>{content}</StoreStatusProvider>);

beforeEach(() => {
  setStoreOpen.mockReset();
  refresh.mockReset();
});

describe("SH-N3 / SH-E1 status dapur", () => {
  it("Buka -> Tutup membuka dialog; batal tetap Buka", async () => {
    renderWithStore(<StoreStatusToggle />);
    await userEvent.click(kitchenSwitch());
    expect(screen.getByText("Pembeli tidak bisa memesan sampai dibuka lagi.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(kitchenSwitch()).toHaveAttribute("aria-checked", "true");
    expect(setStoreOpen).not.toHaveBeenCalled();
  });
  it("konfirmasi tutup berhasil -> Tutup dan data server dimuat ulang", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: false } });
    renderWithStore(<StoreStatusToggle />);
    await userEvent.click(kitchenSwitch());
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() => expect(kitchenSwitch()).toHaveAttribute("aria-checked", "false"));
    expect(setStoreOpen).toHaveBeenCalledWith(false);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
  it("SH-E1 aksi gagal -> kembali Buka + toast error, tanpa refresh", async () => {
    setStoreOpen.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Gagal." } });
    renderWithStore(
      <>
        <Toaster />
        <StoreStatusToggle />
      </>,
    );
    await userEvent.click(kitchenSwitch());
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Pemberitahuan" })).toHaveTextContent("Status dapur belum berubah"),
    );
    expect(kitchenSwitch()).toHaveAttribute("aria-checked", "true");
    expect(refresh).not.toHaveBeenCalled();
  });
  it("SH-E1 aksi melempar (jaringan putus) -> kembali Tutup, saklar aktif lagi, toast", async () => {
    setStoreOpen.mockRejectedValue(new Error("Failed to fetch"));
    renderWithStore(
      <>
        <Toaster />
        <StoreStatusToggle />
      </>,
      { ...INFO, isOpen: false },
    );
    await userEvent.click(kitchenSwitch());
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Pemberitahuan" })).toHaveTextContent("Status dapur belum berubah"),
    );
    expect(kitchenSwitch()).toHaveAttribute("aria-checked", "false");
    expect(kitchenSwitch()).not.toBeDisabled();
  });
  it("membuka dapur tanpa dialog", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: true } });
    renderWithStore(<StoreStatusToggle />, { ...INFO, isOpen: false });
    await userEvent.click(kitchenSwitch());
    expect(kitchenSwitch()).toHaveAttribute("aria-checked", "true");
    expect(setStoreOpen).toHaveBeenCalledWith(true);
  });
  it("saklar nonaktif selama permintaan berjalan", async () => {
    let finishRequest!: (value: unknown) => void;
    setStoreOpen.mockReturnValue(new Promise((resolve) => (finishRequest = resolve)));
    renderWithStore(<StoreStatusToggle />, { ...INFO, isOpen: false });
    await userEvent.click(kitchenSwitch());
    expect(kitchenSwitch()).toBeDisabled();
    finishRequest({ data: { is_open: true } });
    await waitFor(() => expect(kitchenSwitch()).not.toBeDisabled());
  });
  it("SH-A1 saklar menyala tapi di luar jam buka: status Tutup seperti yang dilihat pembeli", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T22:30:00Z")); // 05.30 WIB
    renderWithStore(<StoreStatusToggle />);
    expect(await screen.findByText("Di luar jam buka (07.00–16.00) · pembeli belum bisa memesan")).toBeInTheDocument();
    expect(screen.getByText("Tutup")).toBeInTheDocument();
    expect(screen.queryByText("Buka")).not.toBeInTheDocument();
    // saklar tetap menyala: toko buka otomatis saat jam buka tiba
    expect(kitchenSwitch()).toHaveAttribute("aria-checked", "true");
    vi.useRealTimers();
  });
  it("saklar menyala di dalam jam buka: status Buka", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T03:00:00Z")); // 10.00 WIB
    renderWithStore(<StoreStatusToggle />);
    expect(screen.getByText("Buka")).toBeInTheDocument();
    expect(screen.queryByText(/Di luar jam buka/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("SH-A2 sinkron sidebar dan drawer", () => {
  it("tutup lewat drawer, tutup drawer, buka ulang -> tetap Tutup", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: false } });
    renderWithStore(<MobileNav store={INFO} badge={0} />);
    await userEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    await userEvent.click(kitchenSwitch());
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() => expect(kitchenSwitch()).toHaveAttribute("aria-checked", "false"));
    await userEvent.click(screen.getByRole("button", { name: "Tutup" }));
    await userEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    expect(kitchenSwitch()).toHaveAttribute("aria-checked", "false");
  });
  it("sidebar dan drawer menampilkan status yang sama", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: false } });
    renderWithStore(
      <>
        <Sidebar store={INFO} badge={0} />
        <MobileNav store={INFO} badge={0} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);
    await userEvent.click(switches[1]);
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() =>
      screen
        .getAllByRole("switch")
        .forEach((switchElement) => expect(switchElement).toHaveAttribute("aria-checked", "false")),
    );
  });
  it("nilai server yang berubah menyinkronkan ulang", () => {
    const { rerender } = renderWithStore(<StoreStatusToggle />);
    rerender(
      <StoreStatusProvider store={{ ...INFO, isOpen: false }}>
        <StoreStatusToggle />
      </StoreStatusProvider>,
    );
    expect(kitchenSwitch()).toHaveAttribute("aria-checked", "false");
  });
});
