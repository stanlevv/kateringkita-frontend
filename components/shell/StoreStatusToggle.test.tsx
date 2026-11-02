import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setStoreOpen = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/store", () => ({ setStoreOpen: (...a: unknown[]) => setStoreOpen(...a) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ refresh }) }));
import { Toaster } from "@/components/ui/Toast";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { StoreStatusProvider } from "./StoreStatus";
import { StoreStatusToggle } from "./StoreStatusToggle";

const INFO = { isOpen: true, buka: "07:00", tutup: "16:00" };
const sw = () => screen.getByRole("switch", { name: /Status dapur/ });
const tampil = (ui: React.ReactNode, store = INFO) => render(<StoreStatusProvider store={store}>{ui}</StoreStatusProvider>);

beforeEach(() => {
  setStoreOpen.mockReset();
  refresh.mockReset();
});

describe("SH-N3 / SH-E1 status dapur", () => {
  it("Buka -> Tutup membuka dialog; batal tetap Buka", async () => {
    tampil(<StoreStatusToggle />);
    await userEvent.click(sw());
    expect(screen.getByText("Pembeli tidak bisa memesan sampai dibuka lagi.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(sw()).toHaveAttribute("aria-checked", "true");
    expect(setStoreOpen).not.toHaveBeenCalled();
  });
  it("konfirmasi tutup berhasil -> Tutup dan data server dimuat ulang", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: false } });
    tampil(<StoreStatusToggle />);
    await userEvent.click(sw());
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() => expect(sw()).toHaveAttribute("aria-checked", "false"));
    expect(setStoreOpen).toHaveBeenCalledWith(false);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
  it("SH-E1 aksi gagal -> kembali Buka + toast error, tanpa refresh", async () => {
    setStoreOpen.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Gagal." } });
    tampil(<><Toaster /><StoreStatusToggle /></>);
    await userEvent.click(sw());
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Pemberitahuan" })).toHaveTextContent("Status dapur belum berubah"));
    expect(sw()).toHaveAttribute("aria-checked", "true");
    expect(refresh).not.toHaveBeenCalled();
  });
  it("SH-E1 aksi melempar (jaringan putus) -> kembali Tutup, saklar aktif lagi, toast", async () => {
    setStoreOpen.mockRejectedValue(new Error("Failed to fetch"));
    tampil(<><Toaster /><StoreStatusToggle /></>, { ...INFO, isOpen: false });
    await userEvent.click(sw());
    await waitFor(() => expect(screen.getByRole("region", { name: "Pemberitahuan" })).toHaveTextContent("Status dapur belum berubah"));
    expect(sw()).toHaveAttribute("aria-checked", "false");
    expect(sw()).not.toBeDisabled();
  });
  it("membuka dapur tanpa dialog", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: true } });
    tampil(<StoreStatusToggle />, { ...INFO, isOpen: false });
    await userEvent.click(sw());
    expect(sw()).toHaveAttribute("aria-checked", "true");
    expect(setStoreOpen).toHaveBeenCalledWith(true);
  });
  it("saklar nonaktif selama permintaan berjalan", async () => {
    let selesai!: (v: unknown) => void;
    setStoreOpen.mockReturnValue(new Promise((r) => (selesai = r)));
    tampil(<StoreStatusToggle />, { ...INFO, isOpen: false });
    await userEvent.click(sw());
    expect(sw()).toBeDisabled();
    selesai({ data: { is_open: true } });
    await waitFor(() => expect(sw()).not.toBeDisabled());
  });
  it("SH-A1 label di luar jam buka", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-30T22:30:00Z")); // 05.30 WIB
    tampil(<StoreStatusToggle />);
    expect(await screen.findByText("Di luar jam buka (07.00–16.00)")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("SH-A2 sinkron sidebar dan drawer", () => {
  it("tutup lewat drawer, tutup drawer, buka ulang -> tetap Tutup", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: false } });
    tampil(<MobileNav store={INFO} badge={0} />);
    await userEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    await userEvent.click(sw());
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() => expect(sw()).toHaveAttribute("aria-checked", "false"));
    await userEvent.click(screen.getByRole("button", { name: "Tutup" }));
    await userEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    expect(sw()).toHaveAttribute("aria-checked", "false");
  });
  it("sidebar dan drawer menampilkan status yang sama", async () => {
    setStoreOpen.mockResolvedValue({ data: { is_open: false } });
    tampil(<><Sidebar store={INFO} badge={0} /><MobileNav store={INFO} badge={0} /></>);
    await userEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    const saklar = screen.getAllByRole("switch");
    expect(saklar).toHaveLength(2);
    await userEvent.click(saklar[1]);
    await userEvent.click(screen.getByRole("button", { name: "Tutup dapur" }));
    await waitFor(() => screen.getAllByRole("switch").forEach((s) => expect(s).toHaveAttribute("aria-checked", "false")));
  });
  it("nilai server yang berubah menyinkronkan ulang", () => {
    const { rerender } = tampil(<StoreStatusToggle />);
    rerender(<StoreStatusProvider store={{ ...INFO, isOpen: false }}><StoreStatusToggle /></StoreStatusProvider>);
    expect(sw()).toHaveAttribute("aria-checked", "false");
  });
});
