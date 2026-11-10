import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();
let query = "";
vi.mock("@/services/authService", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
  usePathname: () => "/admin/data-master",
  useSearchParams: () => new URLSearchParams(query),
}));
const tukarUrutan = vi.fn();
const setAktifMaster = vi.fn();
const simpanMaster = vi.fn();
vi.mock("@/app/actions/admin/master", () => ({
  tukarUrutan: (...a: unknown[]) => tukarUrutan(...a), setAktifMaster: (...a: unknown[]) => setAktifMaster(...a), simpanMaster: (...a: unknown[]) => simpanMaster(...a),
}));
const simpanBiayaLayanan = vi.fn();
const simpanPromoPlatform = vi.fn();
const setAktifPromoPlatform = vi.fn();
vi.mock("@/app/actions/admin/promos", () => ({
  simpanBiayaLayanan: (...a: unknown[]) => simpanBiayaLayanan(...a), simpanPromoPlatform: (...a: unknown[]) => simpanPromoPlatform(...a), setAktifPromoPlatform: (...a: unknown[]) => setAktifPromoPlatform(...a),
}));
vi.mock("@/app/actions/promos", () => ({ savePromo: vi.fn(), setPromoActive: vi.fn(), deletePromo: vi.fn() }));
import { ServiceFeeForm } from "@/app/(admin)/admin/components/ServiceFeeForm";
import { PromoList } from "@/app/components/promo/PromoList";
import { Toaster } from "@/app/components/ui/Toast";
import type { Promo } from "@/types/promo";
import DataMasterPage from "./page";
import PromoPage from "../promo/page";

const kat = [
  { id: 1, name: "Nasi", icon: "rice", sort_order: 1, is_active: true },
  { id: 2, name: "Kue", icon: null, sort_order: 2, is_active: true },
];
const titik = [{ id: 7, name: "Kantin A", description: "Dekat gerbang", is_active: true }];
const promo: Promo = { id: 3, code: "PLAT10", description: null, type: "percent", value: 10, max_discount: null, min_subtotal: 0, quota: null, used_count: 0, per_user_limit: 1, starts_at: "2026-11-01T00:00:00.000Z", ends_at: "2027-12-01T00:00:00.000Z", is_active: true };

beforeEach(() => {
  for (const m of [requireAdmin, adminFetch, replace, refresh, tukarUrutan, setAktifMaster, simpanMaster, simpanBiayaLayanan, simpanPromoPlatform, setAktifPromoPlatform]) m.mockReset();
  requireAdmin.mockResolvedValue({ user: { admin_level: "super" } });
  query = "";
});

describe("halaman data master", () => {
  it("requireAdmin dulu; tab dari URL menentukan jenis; tab tak dikenal -> kategori", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: titik });
    render(await DataMasterPage({ searchParams: Promise.resolve({ tab: "titik-temu" }) }));
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminFetch).toHaveBeenCalledWith("/master/pickup-points");
    expect(screen.getByRole("tab", { name: "Titik temu", selected: true })).toBeInTheDocument();
    expect(screen.getByText("Dekat gerbang")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Naikkan/ })).toBeNull();
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    render(await DataMasterPage({ searchParams: Promise.resolve({ tab: "hacker" }) }));
    expect(adminFetch).toHaveBeenLastCalledWith("/master/categories");
  });
  it("tanpa admin: backend tidak dipanggil di kedua halaman", async () => {
    requireAdmin.mockRejectedValue(new Error("404"));
    await expect(DataMasterPage({ searchParams: Promise.resolve({}) })).rejects.toThrow();
    await expect(PromoPage()).rejects.toThrow();
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it("gagal muat -> Coba lagi; kosong -> empty state", async () => {
    adminFetch.mockResolvedValue({ ok: false, status: 500, error: { code: "X", message: "x" } });
    render(await DataMasterPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: [] });
    render(await DataMasterPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Belum ada kategori")).toBeInTheDocument();
  });
  it("klik tab mengubah URL (kategori = tanpa ?tab=)", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: kat });
    render(await DataMasterPage({ searchParams: Promise.resolve({}) }));
    await userEvent.click(screen.getByRole("tab", { name: "Jenis usaha" }));
    expect(replace).toHaveBeenLastCalledWith("/admin/data-master?tab=jenis-usaha", { scroll: false });
    await userEvent.click(screen.getByRole("tab", { name: "Kategori" }));
    expect(replace).toHaveBeenLastCalledWith("/admin/data-master", { scroll: false });
  });
  it("naik/turun memanggil tukarUrutan dengan nilai tetangga; galat -> toast", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: kat });
    tukarUrutan.mockResolvedValue({ data: null });
    render(<><Toaster />{await DataMasterPage({ searchParams: Promise.resolve({}) })}</>);
    expect(screen.getByRole("button", { name: "Naikkan Nasi" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Turunkan Nasi" }));
    expect(tukarUrutan).toHaveBeenCalledWith("categories", { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    tukarUrutan.mockResolvedValue({ error: { code: "X", message: "Server sibuk." } });
    await userEvent.click(screen.getByRole("button", { name: "Naikkan Kue" }));
    expect(await screen.findByText(/Urutan belum berubah/)).toBeInTheDocument();
  });
  it("nilai urutan kembar: pakai peringkat daftar sehingga urutan pasti berubah", async () => {
    const kembar = [0, 1, 2].map((i) => ({ id: i + 1, name: `K${i + 1}`, sort_order: 0, is_active: true }));
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: kembar });
    tukarUrutan.mockResolvedValue({ data: null });
    render(await DataMasterPage({ searchParams: Promise.resolve({}) }));
    await userEvent.click(screen.getByRole("button", { name: "Naikkan K2" }));
    // K2 naik ke posisi 1 (nilai 1), K1 turun ke posisi 2 (nilai 2); aksi menukar: K2 <- nilai K1, K1 <- nilai K2
    expect(tukarUrutan).toHaveBeenLastCalledWith("categories", { id: 2, sort_order: 2 }, { id: 1, sort_order: 1 });
    await userEvent.click(screen.getByRole("button", { name: "Turunkan K2" }));
    expect(tukarUrutan).toHaveBeenLastCalledWith("categories", { id: 2, sort_order: 2 }, { id: 3, sort_order: 3 });
  });
  it("nama kembar (409) ditandai juga di kolom nama", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: kat });
    simpanMaster.mockResolvedValue({ error: { code: "CONFLICT", message: "Nama sudah dipakai." } });
    render(await DataMasterPage({ searchParams: Promise.resolve({}) }));
    await userEvent.click(screen.getByRole("button", { name: "Tambah kategori" }));
    await userEvent.type(screen.getByLabelText(/Nama/), "Nasi");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText("Nama sudah dipakai.")).toBeInTheDocument();
  });
  it("nonaktifkan titik temu terakhir -> 409 menampilkan pesan dengan nama toko", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: titik });
    setAktifMaster.mockResolvedValue({ error: { code: "CONFLICT", message: "Titik temu ini satu-satunya untuk toko: Dapur Ibu, Warung Sari." } });
    render(<><Toaster />{await DataMasterPage({ searchParams: Promise.resolve({ tab: "titik-temu" }) })}</>);
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan Kantin A" }));
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    expect(setAktifMaster).toHaveBeenCalledWith("pickup-points", 7, false);
    expect(await screen.findByText("Titik temu ini satu-satunya untuk toko: Dapur Ibu, Warung Sari.")).toBeInTheDocument();
  });
  it("form tambah: nama wajib di klien; ubah terisi awal", async () => {
    adminFetch.mockResolvedValue({ ok: true, status: 200, data: kat });
    simpanMaster.mockResolvedValue({ data: kat[0] });
    render(await DataMasterPage({ searchParams: Promise.resolve({}) }));
    await userEvent.click(screen.getByRole("button", { name: "Tambah kategori" }));
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText("Nama wajib diisi.")).toBeInTheDocument();
    expect(simpanMaster).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText(/Nama/), "Minuman");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(simpanMaster).toHaveBeenCalledWith("categories", null, { name: "Minuman", icon: "" });
  });
});

describe("promo platform & biaya layanan", () => {
  it("halaman: requireAdmin, daftar promo, biaya dengan formatRupiah", async () => {
    adminFetch.mockImplementation(async (p: string) => p === "/promos" ? { ok: true, status: 200, data: [promo] } : { ok: true, status: 200, data: { service_fee: 2000 } });
    render(await PromoPage());
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Rp\s?2\.000/)).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "PLAT10" })).toBeInTheDocument();
  });
  it("mode admin: Hapus tersembunyi, kode tidak bisa diubah, memakai fungsi simpan admin", async () => {
    simpanPromoPlatform.mockResolvedValue({ data: { ...promo, value: 20 } });
    render(<PromoList admin promos={[promo]} galat={false} simpan={simpanPromoPlatform} setAktifAksi={setAktifPromoPlatform} />);
    expect(screen.queryByRole("button", { name: /Hapus/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Ubah PLAT10" }));
    expect(screen.getByLabelText(/Kode promo/)).toHaveAttribute("readonly");
    await userEvent.click(screen.getByRole("button", { name: "Simpan promo" }));
    await waitFor(() => expect(simpanPromoPlatform).toHaveBeenCalledWith(3, expect.objectContaining({ code: "PLAT10", type: "percent", value: 10 })));
    const input = simpanPromoPlatform.mock.calls[0][1];
    expect(input.starts_at).toMatch(/Z$/);
  });
  it("mode admin: form tanpa saklar Promo aktif; mode penjual tetap punya", async () => {
    const { PromoForm } = await import("@/app/components/promo/PromoForm");
    const { rerender } = render(<PromoForm admin onSaved={vi.fn()} onClose={vi.fn()} simpan={simpanPromoPlatform} />);
    expect(screen.queryByRole("switch", { name: "Promo aktif" })).toBeNull();
    rerender(<PromoForm onSaved={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Promo aktif" })).toBeInTheDocument();
  });
  it("mode admin: validasi form identik (nilai 0 ditolak sebelum memanggil server)", async () => {
    render(<PromoList admin promos={[]} galat={false} simpan={simpanPromoPlatform} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Buat promo" })[0]);
    await userEvent.type(screen.getByLabelText(/Kode promo/), "AB");
    await userEvent.click(screen.getByRole("button", { name: "Simpan promo" }));
    expect(await screen.findAllByText(/Kode 3–30 huruf besar atau angka/)).not.toHaveLength(0);
    expect(simpanPromoPlatform).not.toHaveBeenCalled();
  });
  it("biaya: negatif/pecahan ditolak, sama -> Tidak ada perubahan, valid -> simpan", async () => {
    render(<><Toaster /><ServiceFeeForm nilai={2000} /></>);
    const input = screen.getByLabelText(/Biaya baru/);
    await userEvent.clear(input);
    await userEvent.type(input, "-5");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText("Biaya tidak boleh negatif.")).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "1.5");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText("Biaya harus bilangan bulat.")).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "2000");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText("Tidak ada perubahan")).toBeInTheDocument();
    expect(simpanBiayaLayanan).not.toHaveBeenCalled();
    simpanBiayaLayanan.mockResolvedValue({ data: { service_fee: 3000 } });
    await userEvent.clear(input);
    await userEvent.type(input, "3000");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(simpanBiayaLayanan).toHaveBeenCalledWith(3000));
    expect(await screen.findByText("Biaya layanan disimpan")).toBeInTheDocument();
  });
});
