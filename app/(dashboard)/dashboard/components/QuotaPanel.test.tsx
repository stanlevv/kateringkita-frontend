import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adjustQuota = vi.fn();
vi.mock("@/app/actions/menus", () => ({ adjustQuota: (...a: unknown[]) => adjustQuota(...a) }));
import { Toaster } from "@/app/components/ui/Toast";
import { menus } from "@/lib/fixtures/menus";
import type { MerchantMenu } from "@/types/menu";
import { QuotaPanel } from "./QuotaPanel";

const ayam = menus()[0]; // kuota 40, terjual 22, ditahan 3 -> tersedia 15

beforeEach(() => adjustQuota.mockReset());

describe("QuotaPanel", () => {
  afterEach(() => vi.useRealTimers());

  it("urutan Habis -> Menipis -> Aman", () => {
    render(<QuotaPanel menus={menus()} sekarang={0} terakhir={0} onBerubah={vi.fn()} />);
    const stok = screen.getAllByRole("listitem").map((li) => li.getAttribute("data-stok"));
    const peringkat = stok.map((s) => ["habis", "menipis", "aman"].indexOf(s!));
    expect(peringkat).toEqual([...peringkat].sort((a, b) => a - b));
    expect(stok[0]).toBe("habis");
  });
  it("footer Diperbarui N detik lalu", () => {
    render(<QuotaPanel menus={menus()} sekarang={5_400} terakhir={0} onBerubah={vi.fn()} />);
    expect(screen.getByText("Diperbarui 5 detik lalu")).toBeInTheDocument();
  });
  it("DB-N3 perubahan tombol dikirim sebagai delta setelah jeda, hasil diteruskan", async () => {
    vi.useFakeTimers();
    const hasil = { ...ayam, quota_today: 41, available: 16 };
    adjustQuota.mockResolvedValue({ data: hasil });
    const onBerubah = vi.fn();
    render(<QuotaPanel menus={[ayam]} sekarang={0} terakhir={0} onBerubah={onBerubah} />);
    fireEvent.click(screen.getByRole("button", { name: /Tambah/ }));
    expect(screen.getByRole("spinbutton")).toHaveValue(41);
    expect(adjustQuota).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(adjustQuota).toHaveBeenCalledExactlyOnceWith(1, { delta: 1 });
    expect(onBerubah).toHaveBeenLastCalledWith(hasil);
  });
  it("AUD-04 pengetikan angka langsung dikirim sebagai quota_today absolut setelah jeda", async () => {
    vi.useFakeTimers();
    const hasil = { ...ayam, quota_today: 45, available: 20 };
    adjustQuota.mockResolvedValue({ data: hasil });
    const onBerubah = vi.fn();
    render(<QuotaPanel menus={[ayam]} sekarang={0} terakhir={0} onBerubah={onBerubah} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "45" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(45);
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(adjustQuota).toHaveBeenCalledExactlyOnceWith(1, { quota_today: 45 });
    expect(onBerubah).toHaveBeenLastCalledWith(hasil);
  });
  it("M-04 setelah simpan sukses angka tidak balik ke lama selama menus belum berubah; draf lepas saat data baru tiba", async () => {
    vi.useFakeTimers();
    const hasil = { ...ayam, quota_today: 41, available: 16 };
    adjustQuota.mockResolvedValue({ data: hasil });
    const ui = (list: MerchantMenu[]) => <QuotaPanel menus={list} sekarang={0} terakhir={0} onBerubah={vi.fn()} />;
    const { rerender } = render(ui([ayam]));
    fireEvent.click(screen.getByRole("button", { name: /Tambah/ }));
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(adjustQuota).toHaveBeenCalledOnce();
    expect(screen.getByRole("spinbutton")).toHaveValue(41); // refresh belum tiba
    rerender(ui([hasil])); // data server baru
    expect(screen.getByRole("spinbutton")).toHaveValue(41);
    rerender(ui([{ ...hasil, quota_today: 50, available: 25 }])); // draf sudah lepas: nilai server dipakai
    expect(screen.getByRole("spinbutton")).toHaveValue(50);
  });
  it("DB-E4 server menolak -> angka kembali + toast", async () => {
    vi.useFakeTimers();
    adjustQuota.mockResolvedValue({ error: { code: "CONFLICT", message: "Kuota tidak bisa di bawah porsi yang sudah dipesan (25)." } });
    const onBerubah = vi.fn();
    render(<><Toaster /><QuotaPanel menus={[ayam]} sekarang={0} terakhir={0} onBerubah={onBerubah} /></>);
    fireEvent.click(screen.getByRole("button", { name: /Tambah/ }));
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(screen.getByRole("spinbutton")).toHaveValue(40);
    expect(within(screen.getByRole("region", { name: "Pemberitahuan" })).getByText(/porsi yang sudah dipesan/)).toBeInTheDocument();
    expect(onBerubah).not.toHaveBeenCalled();
  });
  it("kosong -> EmptyState kuota", () => {
    render(<QuotaPanel menus={[]} sekarang={0} terakhir={0} onBerubah={vi.fn()} />);
    expect(screen.getByText("Belum ada menu aktif")).toBeInTheDocument();
  });
});
