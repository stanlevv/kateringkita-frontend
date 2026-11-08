import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
const setPromoActive = vi.fn();
const deletePromo = vi.fn();
const savePromo = vi.fn();
vi.mock("@/app/actions/promos", () => ({
  setPromoActive: (...a: unknown[]) => setPromoActive(...a),
  deletePromo: (...a: unknown[]) => deletePromo(...a),
  savePromo: (...a: unknown[]) => savePromo(...a),
}));
import { Toaster } from "@/app/components/ui/Toast";
import { promos } from "@/lib/fixtures/promos";
import { PromoList } from "./PromoList";

const semua = promos();
const tampil = (list = semua, galat = false) => render(<><Toaster /><PromoList promos={list} galat={galat} /></>);
beforeEach(() => { setPromoActive.mockReset(); deletePromo.mockReset(); savePromo.mockReset(); });

describe("PromoList (PR-N1, PR-N3, PR-S1)", () => {
  it("PR-N1 kartu: kode, jenis, terpakai, status dengan teks", () => {
    tampil();
    const kartu = screen.getByRole("article", { name: "HEMAT10" });
    expect(within(kartu).getByText("Diskon 10% maks Rp 10.000")).toBeInTheDocument();
    expect(within(kartu).getByText(/37\/100/)).toBeInTheDocument();
    expect(within(kartu).getByText("Aktif")).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "SARAPAN5K" })).getByText("Terjadwal")).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "SARAPAN5K" })).getByText(/0 terpakai/)).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "AKHIRBULAN" })).getByText("Berakhir")).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "GRATISBIAYA" })).getByText("Nonaktif")).toBeInTheDocument();
  });

  it("PR-S1 kosong", () => {
    tampil([]);
    expect(screen.getByText("Belum ada promo")).toBeInTheDocument();
    expect(screen.getByText("Buat kode promo untuk menarik pembeli")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Buat promo" }).length).toBeGreaterThan(0);
  });

  it("gagal muat -> Coba lagi", () => {
    tampil([], true);
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });

  it("PR-N3 hapus hanya bila belum dipakai; yang dipakai diberi saran nonaktifkan", () => {
    tampil();
    expect(screen.queryByRole("button", { name: "Hapus HEMAT10" })).toBeNull();
    expect(within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Sudah dipakai — nonaktifkan saja")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hapus SARAPAN5K" })).toBeInTheDocument();
  });

  it("hapus lewat dialog konfirmasi -> kartu hilang", async () => {
    deletePromo.mockResolvedValue({ data: { id: 2 } });
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Hapus SARAPAN5K" }));
    await userEvent.click(screen.getByRole("button", { name: "Hapus promo" }));
    await waitFor(() => expect(screen.queryByRole("article", { name: "SARAPAN5K" })).toBeNull());
    expect(deletePromo).toHaveBeenCalledWith(2);
  });

  it("nonaktifkan langsung + toast Batalkan yang mengaktifkan lagi", async () => {
    setPromoActive.mockImplementation(async (id: number, aktif: boolean) => ({ data: { ...semua.find((p) => p.id === id)!, is_active: aktif } }));
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan HEMAT10" }));
    await waitFor(() => expect(within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Nonaktif")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    await waitFor(() => expect(within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Aktif")).toBeInTheDocument());
    expect(setPromoActive).toHaveBeenLastCalledWith(1, true);
  });

  it("aksi gagal -> status kembali + toast galat", async () => {
    setPromoActive.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "Promo belum diubah. Coba lagi." } });
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan HEMAT10" }));
    await waitFor(() => expect(screen.getByText("Promo belum diubah. Coba lagi.")).toBeInTheDocument());
    expect(within(screen.getByRole("article", { name: "HEMAT10" })).getByText("Aktif")).toBeInTheDocument();
  });

  it("PR-N2 promo baru muncul di atas setelah simpan", async () => {
    savePromo.mockResolvedValue({ data: { ...semua[0], id: 9, code: "BARU10", used_count: 0 } });
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "Buat promo" }));
    await userEvent.type(screen.getByLabelText(/Kode promo/), "baru10");
    await userEvent.type(screen.getByLabelText(/^Nilai/), "10");
    await userEvent.click(screen.getByRole("button", { name: "Simpan promo" }));
    await waitFor(() => expect(screen.getByRole("article", { name: "BARU10" })).toBeInTheDocument());
    expect(screen.getAllByRole("article")[0]).toHaveAccessibleName("BARU10");
    expect(screen.getByText("Promo disimpan")).toBeInTheDocument();
  });
});
