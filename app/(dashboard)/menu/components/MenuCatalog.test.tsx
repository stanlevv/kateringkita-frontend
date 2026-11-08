import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let params = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  usePathname: () => "/menu",
  useSearchParams: () => params,
}));
const adjustQuota = vi.fn();
const setMenuActive = vi.fn();
vi.mock("@/app/actions/menus", () => ({
  adjustQuota: (...a: unknown[]) => adjustQuota(...a),
  setMenuActive: (...a: unknown[]) => setMenuActive(...a),
}));
import { Toaster } from "@/app/components/ui/Toast";
import { categories } from "@/lib/fixtures/meta";
import { menus } from "@/lib/fixtures/menus";
import { MenuCatalog } from "./MenuCatalog";

const semua = menus();
const tampil = (m = semua, galat = false) =>
  render(<><Toaster /><MenuCatalog menus={m} categories={categories()} galat={galat} /></>);
const kartu = (nama: string) => screen.getByRole("article", { name: nama });

beforeEach(() => {
  replace.mockReset();
  adjustQuota.mockReset();
  setMenuActive.mockReset();
  params = new URLSearchParams();
});

describe("MN-N1 kartu", () => {
  it("menampilkan harga, margin %, badge stok, rincian dan aksi Ubah", () => {
    tampil();
    const k = within(kartu("Nasi Ayam Bakar Madu"));
    expect(k.getByText("Rp 22.000")).toBeInTheDocument();
    expect(k.getByText(/36%/)).toBeInTheDocument();
    expect(k.getByText("Tersedia 15 · Ditahan 3 · Terjual 22")).toBeInTheDocument();
    expect(k.getByRole("link", { name: /Ubah/ })).toHaveAttribute("href", "/menu/1");
  });
});

describe("MN-N2 filter di URL", () => {
  it("tab status menampilkan jumlah dan mengubah URL", async () => {
    tampil();
    expect(screen.getByRole("tab", { name: /Semua\s*12/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Nonaktif\s*1/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Nonaktif/ }));
    expect(replace).toHaveBeenCalledWith("/menu?status=nonaktif", { scroll: false });
  });
  it("status & kategori dari URL menyaring daftar", () => {
    params = new URLSearchParams("status=nonaktif");
    tampil();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Aktifkan lagi" })).toBeInTheDocument(); // MN-A2
  });
  it("kategori memperbarui URL", () => {
    tampil();
    fireEvent.change(screen.getByLabelText("Kategori"), { target: { value: "minuman" } });
    expect(replace).toHaveBeenCalledWith("/menu?kategori=minuman", { scroll: false });
  });
  it("q dikirim ke URL setelah 300 ms", async () => {
    vi.useFakeTimers();
    tampil();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "es" } });
    expect(replace).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(replace).toHaveBeenCalledWith("/menu?q=es", { scroll: false });
    vi.useRealTimers();
  });
});

describe("MN-S1/S2/S3 state", () => {
  it("MN-S1 belum ada menu", () => {
    tampil([]);
    expect(screen.getByText("Belum ada menu. Tambahkan menu pertama agar pembeli bisa memesan.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tambah menu" })).toHaveAttribute("href", "/menu/baru");
  });
  it("MN-S2 filter tanpa hasil + Hapus filter membersihkan URL", async () => {
    params = new URLSearchParams("q=zzz&kategori=snack");
    tampil();
    expect(screen.getByText('Tidak ada menu yang cocok dengan "zzz"')).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(replace).toHaveBeenCalledWith("/menu", { scroll: false });
  });
  it("MN-S3 gagal muat", () => {
    tampil(semua, true);
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});

describe("MN-A1/E1 nonaktifkan", () => {
  it("dialog -> menu hilang dari tab Aktif seketika + toast Batalkan yang mengaktifkan lagi", async () => {
    setMenuActive.mockResolvedValue({ data: { ...semua[0] } });
    tampil();
    await userEvent.click(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" }));
    expect(screen.getByText("Menu disembunyikan dari pembeli. Pesanan lama tetap tercatat.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan menu" }));
    expect(setMenuActive).toHaveBeenCalledWith(1, false);
    expect(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Aktifkan lagi" })).toBeInTheDocument();
    expect(screen.getByText("Menu dinonaktifkan")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    expect(setMenuActive).toHaveBeenLastCalledWith(1, true);
    expect(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
  });
  it("MN-E1 gagal -> keadaan kembali + toast galat", async () => {
    setMenuActive.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Menu belum diubah. Coba lagi." } });
    tampil();
    await userEvent.click(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" }));
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan menu" }));
    expect(await screen.findByText("Menu belum diubah. Coba lagi.")).toBeInTheDocument();
    expect(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
  });
  it("MN-A2 Aktifkan lagi memanggil aksi", async () => {
    params = new URLSearchParams("status=nonaktif");
    setMenuActive.mockResolvedValue({ data: semua[8] });
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan lagi" }));
    expect(setMenuActive).toHaveBeenCalledWith(9, true);
  });
});

describe("MN-N4 kuota inline", () => {
  it("stepper tombol + mengirim delta atomik setelah jeda", async () => {
    vi.useFakeTimers();
    adjustQuota.mockResolvedValue({ data: { ...semua[0], quota_today: 41, available: 16 } });
    tampil();
    await act(async () => { fireEvent.click(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: /Tambah Kuota/ })); });
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(adjustQuota).toHaveBeenCalledWith(1, { delta: 1 });
    vi.useRealTimers();
  });
  it("stepper pengetikan langsung mengirim quota_today absolut setelah jeda", async () => {
    vi.useFakeTimers();
    adjustQuota.mockResolvedValue({ data: { ...semua[0], quota_today: 45, available: 20 } });
    tampil();
    const input = within(kartu("Nasi Ayam Bakar Madu")).getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "45" } });
    fireEvent.blur(input);
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(adjustQuota).toHaveBeenCalledWith(1, { quota_today: 45 });
    vi.useRealTimers();
  });
});

describe("MN-N4 baris server disalin utuh", () => {
  it("terjual & ditahan dari server ikut tampil setelah kuota berubah", async () => {
    vi.useFakeTimers();
    adjustQuota.mockResolvedValue({ data: { ...semua[0], quota_today: 41, available: 3, sold_today: 30, held_today: 8 } });
    tampil();
    await act(async () => { fireEvent.click(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: /Tambah Kuota/ })); });
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(within(kartu("Nasi Ayam Bakar Madu")).getByText("Tersedia 3 · Ditahan 8 · Terjual 30")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("MN-N2 balapan timer pencarian", () => {
  it("Hapus filter membatalkan ketikan tertunda: tidak ada replace yang memulihkan filter", async () => {
    vi.useFakeTimers();
    params = new URLSearchParams("q=zzz&kategori=snack");
    tampil();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzx" } });
    fireEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/menu", { scroll: false });
    vi.useRealTimers();
  });
  it("mengetik q lalu ganti kategori sebelum 300 ms: keduanya tersimpan, tanpa replace susulan", async () => {
    vi.useFakeTimers();
    tampil();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "es" } });
    fireEvent.change(screen.getByLabelText("Kategori"), { target: { value: "minuman" } });
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/menu?kategori=minuman&q=es", { scroll: false });
    vi.useRealTimers();
  });
  it("q di URL berubah dari luar (Back) -> kotak cari ikut", () => {
    params = new URLSearchParams("q=es");
    const { rerender } = tampil();
    expect(screen.getByRole("searchbox")).toHaveValue("es");
    params = new URLSearchParams();
    rerender(<><Toaster /><MenuCatalog menus={semua} categories={categories()} galat={false} /></>);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});

describe("D13 overlay lokal gugur saat data server baru tiba (M-05)", () => {
  const ui = (m: typeof semua) => <><Toaster /><MenuCatalog menus={m} categories={categories()} galat={false} /></>;
  it("hasil ubah kuota tampil, lalu menus baru dari server menang", async () => {
    adjustQuota.mockResolvedValue({ data: { ...semua[0], quota_today: semua[0].quota_today + 1, sold_today: 1, available: 0 } });
    const { rerender } = render(ui(semua));
    await userEvent.click(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Tambah Kuota Nasi Ayam Bakar Madu" }));
    await waitFor(() => expect(within(kartu("Nasi Ayam Bakar Madu")).getByText(/Terjual 1$/)).toBeInTheDocument());
    rerender(ui(semua.map((m) => (m.id === 1 ? { ...m, sold_today: 4 } : m))));
    expect(within(kartu("Nasi Ayam Bakar Madu")).getByText(/Terjual 4$/)).toBeInTheDocument();
  });
  it("nonaktif optimistis, lalu server mengirim is_active true -> aktif", async () => {
    setMenuActive.mockResolvedValue({ data: { ...semua[0], is_active: false } });
    const { rerender } = render(ui(semua));
    await userEvent.click(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" }));
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan menu" }));
    expect(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Aktifkan lagi" })).toBeInTheDocument();
    rerender(ui(menus()));
    expect(within(kartu("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
  });
});
