import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adjustQuota = vi.fn();
vi.mock("@/app/actions/menus", () => ({ adjustQuota: (...a: unknown[]) => adjustQuota(...a) }));
import { Toaster } from "@/components/ui/Toast";
import { menus } from "@/lib/fixtures/menus";
import type { MerchantMenu } from "@/lib/types";
import { QuotaPanel } from "./QuotaPanel";
import { QuotaRow } from "./QuotaRow";

const ayam = menus()[0]; // kuota 40, terjual 22, ditahan 3 -> tersedia 15
const m = (p: Partial<MerchantMenu>): MerchantMenu => ({ ...ayam, ...p });

beforeEach(() => adjustQuota.mockReset());

describe("QuotaRow (brief §5)", () => {
  it("baris: nama, badge stok ikon+teks, Tersedia · Ditahan · Terjual", () => {
    render(<QuotaRow menu={ayam} onUbah={vi.fn()} />);
    expect(screen.getByText("Nasi Ayam Bakar Madu")).toBeInTheDocument();
    expect(screen.getByText("Aman").closest("span")?.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Tersedia 15 · Ditahan 3 · Terjual 22")).toBeInTheDocument();
  });
  it("DB-E4 batas bawah = terjual + ditahan: tombol − nonaktif + keterangan", () => {
    render(<QuotaRow menu={m({ quota_today: 25, available: 0 })} onUbah={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Kurangi/ })).toBeDisabled();
    expect(screen.getByText("Tidak bisa di bawah porsi yang sudah dipesan")).toBeInTheDocument();
  });
  it("Review Focus 3: ketik di bawah batas -> ditolak, nilai kembali", async () => {
    const onUbah = vi.fn();
    render(<QuotaRow menu={m({ quota_today: 30, available: 5 })} onUbah={onUbah} />);
    const input = screen.getByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "20");
    fireEvent.blur(input);
    expect(input).toHaveValue(30);
    expect(onUbah).not.toHaveBeenCalled();
  });
  it("DB-N3 menu habis punya +5 / +10", async () => {
    const onUbah = vi.fn();
    render(<QuotaRow menu={m({ quota_today: 25, available: 0 })} onUbah={onUbah} />);
    expect(screen.getByText("Habis")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /\+5/ }));
    expect(onUbah).toHaveBeenCalledWith(30);
    await userEvent.click(screen.getByRole("button", { name: /\+10/ }));
    expect(onUbah).toHaveBeenCalledWith(35);
  });
  it("menu aman tidak punya tombol cepat", () => {
    render(<QuotaRow menu={ayam} onUbah={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /\+5/ })).toBeNull();
  });
});

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
  it("DB-N3 perubahan dikirim sebagai quota_today setelah jeda, hasil diteruskan", async () => {
    vi.useFakeTimers();
    const hasil = { ...ayam, quota_today: 41, available: 16 };
    adjustQuota.mockResolvedValue({ data: hasil });
    const onBerubah = vi.fn();
    render(<QuotaPanel menus={[ayam]} sekarang={0} terakhir={0} onBerubah={onBerubah} />);
    fireEvent.click(screen.getByRole("button", { name: /Tambah/ }));
    expect(screen.getByRole("spinbutton")).toHaveValue(41);
    expect(adjustQuota).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(adjustQuota).toHaveBeenCalledExactlyOnceWith(1, { quota_today: 41 });
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
