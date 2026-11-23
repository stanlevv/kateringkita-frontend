// Test MenuCatalog: kartu menu, filter di URL, keadaan kosong/gagal, nonaktifkan/aktifkan, kuota inline, dan
// salinan lokal yang gugur saat data server baru tiba. Router dan server action dipalsukan (vi.mock).
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
  adjustQuota: (...args: unknown[]) => adjustQuota(...args),
  setMenuActive: (...args: unknown[]) => setMenuActive(...args),
}));
import { Toaster } from "@/app/components/ui/Toast";
import { categories } from "@/lib/fixtures/meta";
import { menus } from "@/lib/fixtures/menus";
import { MenuCatalog } from "./MenuCatalog";

const allMenus = menus();
const renderCatalog = (menuList = allMenus, loadFailed = false) =>
  render(
    <>
      <Toaster />
      <MenuCatalog menus={menuList} categories={categories()} loadFailed={loadFailed} />
    </>,
  );
const card = (name: string) => screen.getByRole("article", { name });

beforeEach(() => {
  replace.mockReset();
  adjustQuota.mockReset();
  setMenuActive.mockReset();
  params = new URLSearchParams();
});

describe("MN-N1 kartu", () => {
  it("menampilkan harga, margin %, badge stok, rincian dan aksi Ubah", () => {
    renderCatalog();
    const cardScope = within(card("Nasi Ayam Bakar Madu"));
    expect(cardScope.getByText("Rp 22.000")).toBeInTheDocument();
    expect(cardScope.getByText(/36%/)).toBeInTheDocument();
    expect(cardScope.getByText("Tersedia 15 · Ditahan 3 · Terjual 22")).toBeInTheDocument();
    expect(cardScope.getByRole("link", { name: /Ubah/ })).toHaveAttribute("href", "/menu/1");
  });
});

describe("MN-N2 filter di URL", () => {
  it("tab status menampilkan jumlah dan mengubah URL", async () => {
    renderCatalog();
    expect(screen.getByRole("tab", { name: /Semua\s*12/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Nonaktif\s*1/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Nonaktif/ }));
    expect(replace).toHaveBeenCalledWith("/menu?status=nonaktif", { scroll: false });
  });
  it("status & kategori dari URL menyaring daftar", () => {
    params = new URLSearchParams("status=nonaktif");
    renderCatalog();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Aktifkan lagi" })).toBeInTheDocument(); // menu nonaktif bisa diaktifkan lagi
  });
  it("kategori memperbarui URL", () => {
    renderCatalog();
    fireEvent.change(screen.getByLabelText("Kategori"), { target: { value: "minuman" } });
    expect(replace).toHaveBeenCalledWith("/menu?kategori=minuman", { scroll: false });
  });
  it("q dikirim ke URL setelah 300 ms", async () => {
    vi.useFakeTimers();
    renderCatalog();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "es" } });
    expect(replace).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(replace).toHaveBeenCalledWith("/menu?q=es", { scroll: false });
    vi.useRealTimers();
  });
});

describe("MN-S1/S2/S3 state", () => {
  it("MN-S1 belum ada menu", () => {
    renderCatalog([]);
    expect(screen.getByText("Belum ada menu. Tambahkan menu pertama agar pembeli bisa memesan.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tambah menu" })).toHaveAttribute("href", "/menu/baru");
  });
  it("MN-S2 filter tanpa hasil + Hapus filter membersihkan URL", async () => {
    params = new URLSearchParams("q=zzz&kategori=snack");
    renderCatalog();
    expect(screen.getByText('Tidak ada menu yang cocok dengan "zzz"')).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(replace).toHaveBeenCalledWith("/menu", { scroll: false });
  });
  it("MN-S3 gagal muat", () => {
    renderCatalog(allMenus, true);
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });
});

describe("MN-A1/E1 nonaktifkan", () => {
  it("dialog -> menu hilang dari tab Aktif seketika + toast Batalkan yang mengaktifkan lagi", async () => {
    setMenuActive.mockResolvedValue({ data: { ...allMenus[0] } });
    renderCatalog();
    await userEvent.click(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" }));
    expect(screen.getByText("Menu disembunyikan dari pembeli. Pesanan lama tetap tercatat.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan menu" }));
    expect(setMenuActive).toHaveBeenCalledWith(1, false);
    expect(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Aktifkan lagi" })).toBeInTheDocument();
    expect(screen.getByText("Menu dinonaktifkan")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    expect(setMenuActive).toHaveBeenLastCalledWith(1, true);
    expect(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
  });
  it("MN-E1 gagal -> keadaan kembali + toast galat", async () => {
    setMenuActive.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Menu belum diubah. Coba lagi." } });
    renderCatalog();
    await userEvent.click(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" }));
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan menu" }));
    expect(await screen.findByText("Menu belum diubah. Coba lagi.")).toBeInTheDocument();
    expect(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
  });
  it("MN-A2 Aktifkan lagi memanggil aksi", async () => {
    params = new URLSearchParams("status=nonaktif");
    setMenuActive.mockResolvedValue({ data: allMenus[8] });
    renderCatalog();
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan lagi" }));
    expect(setMenuActive).toHaveBeenCalledWith(9, true);
  });
});

describe("MN-N4 kuota inline", () => {
  it("stepper tombol + mengirim delta atomik setelah jeda", async () => {
    vi.useFakeTimers();
    adjustQuota.mockResolvedValue({ data: { ...allMenus[0], quota_today: 41, available: 16 } });
    renderCatalog();
    await act(async () => {
      fireEvent.click(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: /Tambah Kuota/ }));
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(adjustQuota).toHaveBeenCalledWith(1, { delta: 1 });
    vi.useRealTimers();
  });
  it("stepper pengetikan langsung mengirim quota_today absolut setelah jeda", async () => {
    vi.useFakeTimers();
    adjustQuota.mockResolvedValue({ data: { ...allMenus[0], quota_today: 45, available: 20 } });
    renderCatalog();
    const input = within(card("Nasi Ayam Bakar Madu")).getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "45" } });
    fireEvent.blur(input);
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(adjustQuota).toHaveBeenCalledWith(1, { quota_today: 45 });
    vi.useRealTimers();
  });
});

describe("MN-N4 baris server disalin utuh", () => {
  it("terjual & ditahan dari server ikut tampil setelah kuota berubah", async () => {
    vi.useFakeTimers();
    adjustQuota.mockResolvedValue({
      data: { ...allMenus[0], quota_today: 41, available: 3, sold_today: 30, held_today: 8 },
    });
    renderCatalog();
    await act(async () => {
      fireEvent.click(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: /Tambah Kuota/ }));
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(within(card("Nasi Ayam Bakar Madu")).getByText("Tersedia 3 · Ditahan 8 · Terjual 30")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("MN-N2 balapan timer pencarian", () => {
  it("Hapus filter membatalkan ketikan tertunda: tidak ada replace yang memulihkan filter", async () => {
    vi.useFakeTimers();
    params = new URLSearchParams("q=zzz&kategori=snack");
    renderCatalog();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzx" } });
    fireEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/menu", { scroll: false });
    vi.useRealTimers();
  });
  it("mengetik q lalu ganti kategori sebelum 300 ms: keduanya tersimpan, tanpa replace susulan", async () => {
    vi.useFakeTimers();
    renderCatalog();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "es" } });
    fireEvent.change(screen.getByLabelText("Kategori"), { target: { value: "minuman" } });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/menu?kategori=minuman&q=es", { scroll: false });
    vi.useRealTimers();
  });
  it("q di URL berubah dari luar (Back) -> kotak cari ikut", () => {
    params = new URLSearchParams("q=es");
    const { rerender } = renderCatalog();
    expect(screen.getByRole("searchbox")).toHaveValue("es");
    params = new URLSearchParams();
    rerender(
      <>
        <Toaster />
        <MenuCatalog menus={allMenus} categories={categories()} loadFailed={false} />
      </>,
    );
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});

describe("D13 overlay lokal gugur saat data server baru tiba (M-05)", () => {
  const catalogTree = (menuList: typeof allMenus) => (
    <>
      <Toaster />
      <MenuCatalog menus={menuList} categories={categories()} loadFailed={false} />
    </>
  );
  it("hasil ubah kuota tampil, lalu menus baru dari server menang", async () => {
    adjustQuota.mockResolvedValue({
      data: { ...allMenus[0], quota_today: allMenus[0].quota_today + 1, sold_today: 1, available: 0 },
    });
    const { rerender } = render(catalogTree(allMenus));
    await userEvent.click(
      within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Tambah Kuota Nasi Ayam Bakar Madu" }),
    );
    await waitFor(() => expect(within(card("Nasi Ayam Bakar Madu")).getByText(/Terjual 1$/)).toBeInTheDocument());
    rerender(catalogTree(allMenus.map((menu) => (menu.id === 1 ? { ...menu, sold_today: 4 } : menu))));
    expect(within(card("Nasi Ayam Bakar Madu")).getByText(/Terjual 4$/)).toBeInTheDocument();
  });
  it("nonaktif optimistis, lalu server mengirim is_active true -> aktif", async () => {
    setMenuActive.mockResolvedValue({ data: { ...allMenus[0], is_active: false } });
    const { rerender } = render(catalogTree(allMenus));
    await userEvent.click(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" }));
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan menu" }));
    expect(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Aktifkan lagi" })).toBeInTheDocument();
    rerender(catalogTree(menus()));
    expect(within(card("Nasi Ayam Bakar Madu")).getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
  });
});
