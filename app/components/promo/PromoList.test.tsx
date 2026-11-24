// Test PromoList: isi kartu dan status, lencana Tersembunyi, kosong, gagal muat, aturan hapus, nonaktifkan + Batalkan,
// aksi gagal, voucher baru di atas, serta arsip dan pulihkan promo platform (mode admin). Server action dipalsukan
// (vi.mock).
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
const setPromoActive = vi.fn();
const deletePromo = vi.fn();
const savePromo = vi.fn();
vi.mock("@/app/actions/promos", () => ({
  setPromoActive: (...args: unknown[]) => setPromoActive(...args),
  deletePromo: (...args: unknown[]) => deletePromo(...args),
  savePromo: (...args: unknown[]) => savePromo(...args),
}));
import { Toaster } from "@/app/components/ui/Toast";
import { promos } from "@/lib/fixtures/promos";
import { PromoList } from "./PromoList";

const allPromos = promos();
const renderList = (list = allPromos, loadFailed = false) =>
  render(
    <>
      <Toaster />
      <PromoList promos={list} loadFailed={loadFailed} />
    </>,
  );
beforeEach(() => {
  setPromoActive.mockReset();
  deletePromo.mockReset();
  savePromo.mockReset();
});

describe("PromoList", () => {
  it("kartu: kode, jenis, terpakai, status dengan teks", () => {
    renderList();
    const card = screen.getByRole("article", { name: "HEMAT10" });
    expect(within(card).getByText("Diskon 10% maks Rp 10.000")).toBeInTheDocument();
    expect(within(card).getByText(/37\/100/)).toBeInTheDocument();
    expect(within(card).getByText("Aktif")).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "SARAPAN5K" })).getByText("Terjadwal")).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "SARAPAN5K" })).getByText(/0 terpakai/)).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "AKHIRBULAN" })).getByText("Berakhir")).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "GRATISBIAYA" })).getByText("Nonaktif")).toBeInTheDocument();
  });

  it("voucher disembunyikan dari halaman toko → lencana Tersembunyi", () => {
    renderList([
      { ...allPromos[0], is_public: false },
      { ...allPromos[1], is_public: true },
    ]);
    expect(screen.getAllByText("Tersembunyi")).toHaveLength(1);
  });

  it("kosong", () => {
    renderList([]);
    expect(screen.getByText("Belum ada promo")).toBeInTheDocument();
    expect(screen.getByText("Buat kode promo untuk menarik pembeli")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Buat promo" }).length).toBeGreaterThan(0);
  });

  it("gagal muat -> Coba lagi", () => {
    renderList([], true);
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });

  it("hapus hanya bila belum dipakai; yang dipakai diberi saran nonaktifkan", () => {
    renderList();
    expect(screen.queryByRole("button", { name: "Hapus HEMAT10" })).toBeNull();
    expect(
      within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Sudah dipakai — nonaktifkan saja"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hapus SARAPAN5K" })).toBeInTheDocument();
  });

  it("hapus lewat dialog konfirmasi -> kartu hilang", async () => {
    deletePromo.mockResolvedValue({ data: { id: 2 } });
    renderList();
    await userEvent.click(screen.getByRole("button", { name: "Hapus SARAPAN5K" }));
    await userEvent.click(screen.getByRole("button", { name: "Hapus promo" }));
    await waitFor(() => expect(screen.queryByRole("article", { name: "SARAPAN5K" })).toBeNull());
    expect(deletePromo).toHaveBeenCalledWith(2);
  });

  it("nonaktifkan langsung + toast Batalkan yang mengaktifkan lagi", async () => {
    setPromoActive.mockImplementation(async (id: number, active: boolean) => ({
      data: { ...allPromos.find((promo) => promo.id === id)!, is_active: active },
    }));
    renderList();
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan HEMAT10" }));
    await waitFor(() =>
      expect(within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Nonaktif")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    await waitFor(() =>
      expect(within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Aktif")).toBeInTheDocument(),
    );
    expect(setPromoActive).toHaveBeenLastCalledWith(1, true);
  });

  it("aksi gagal -> status kembali + toast galat", async () => {
    setPromoActive.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Promo belum diubah. Coba lagi." } });
    renderList();
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan HEMAT10" }));
    await waitFor(() => expect(screen.getByText("Promo belum diubah. Coba lagi.")).toBeInTheDocument());
    expect(within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Aktif")).toBeInTheDocument();
  });

  it("promo baru muncul di atas setelah simpan", async () => {
    savePromo.mockResolvedValue({ data: { ...allPromos[0], id: 9, code: "BARU10", used_count: 0 } });
    renderList();
    await userEvent.click(screen.getByRole("button", { name: "Buat promo" }));
    await userEvent.type(screen.getByLabelText(/Kode promo/), "baru10");
    await userEvent.type(screen.getByLabelText(/^Nilai/), "10");
    await userEvent.click(screen.getByRole("button", { name: "Simpan promo" }));
    await waitFor(() => expect(screen.getByRole("article", { name: "BARU10" })).toBeInTheDocument());
    expect(screen.getAllByRole("article")[0]).toHaveAccessibleName("BARU10");
    expect(screen.getByText("Promo disimpan")).toBeInTheDocument();
  });

  describe("arsip promo platform (mode admin)", () => {
    const archiveAction = vi.fn();
    const renderAdmin = (props: { archived?: boolean; canEdit?: boolean } = {}) =>
      render(
        <>
          <Toaster />
          <PromoList admin promos={allPromos} loadFailed={false} archiveAction={archiveAction} {...props} />
        </>,
      );
    beforeEach(() => archiveAction.mockReset().mockResolvedValue({ data: allPromos[0] }));

    it("Arsipkan lewat konfirmasi -> kartu hilang", async () => {
      renderAdmin();
      await userEvent.click(screen.getByRole("button", { name: "Arsipkan HEMAT10" }));
      expect(archiveAction).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole("button", { name: "Ya, arsipkan" }));
      await waitFor(() => expect(archiveAction).toHaveBeenCalledWith(1, true));
      await waitFor(() => expect(screen.queryByRole("article", { name: "HEMAT10" })).toBeNull());
      expect(screen.getByText("Promo diarsipkan")).toBeInTheDocument();
    });

    it("PROMO_IN_USE: pesan tampil apa adanya, kartu tetap", async () => {
      const message = "Promo masih dipakai di pop-up atau banner: Promo akhir pekan.";
      archiveAction.mockResolvedValue({ error: { code: "PROMO_IN_USE", message } });
      renderAdmin();
      await userEvent.click(screen.getByRole("button", { name: "Arsipkan HEMAT10" }));
      await userEvent.click(screen.getByRole("button", { name: "Ya, arsipkan" }));
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByRole("article", { name: "HEMAT10" })).toBeInTheDocument();
    });

    it("tampilan Arsip: hanya Pulihkan; kosong tanpa tombol Buat", async () => {
      const { unmount } = renderAdmin({ archived: true });
      for (const name of ["Buat promo", "Ubah HEMAT10", "Nonaktifkan HEMAT10", "Arsipkan HEMAT10"])
        expect(screen.queryByRole("button", { name })).toBeNull();
      await userEvent.click(screen.getByRole("button", { name: "Pulihkan HEMAT10" }));
      expect(archiveAction).toHaveBeenCalledWith(1, false);
      await waitFor(() => expect(screen.queryByRole("article", { name: "HEMAT10" })).toBeNull());
      expect(screen.getByText("Promo dipulihkan")).toBeInTheDocument();
      unmount();
      render(<PromoList admin promos={[]} loadFailed={false} archiveAction={archiveAction} archived />);
      expect(screen.getByText("Belum ada promo yang diarsipkan")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Buat promo" })).toBeNull();
    });

    it("support: tanpa tombol buat, ubah, aktifkan, arsip, maupun pulihkan", () => {
      const { unmount } = renderAdmin({ canEdit: false });
      for (const name of [/Buat promo/, /^Ubah/, /^Nonaktifkan/, /^Aktifkan/, /^Arsipkan/])
        expect(screen.queryByRole("button", { name })).toBeNull();
      unmount();
      renderAdmin({ canEdit: false, archived: true });
      expect(screen.queryByRole("button", { name: /^Pulihkan/ })).toBeNull();
    });

    it("mode penjual tidak punya tombol Arsipkan", () => {
      renderList();
      expect(screen.queryByRole("button", { name: /^Arsipkan/ })).toBeNull();
    });
  });
});
