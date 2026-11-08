import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const replace = vi.fn();
const aksiPenjual = vi.fn();
const url = vi.hoisted(() => ({ q: "status=pending" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace, push: vi.fn() }),
  usePathname: () => "/admin/penjual",
  useSearchParams: () => new URLSearchParams(url.q),
}));
vi.mock("@/app/actions/admin/merchants", () => ({ aksiPenjual: (...a: unknown[]) => aksiPenjual(...a) }));
import { Toaster } from "@/app/components/ui/Toast";
import { StatusToko } from "@/app/components/StatusToko";
import type { AntrianPenjual, Checklist as C, DetailPenjual, PenjualRingkas } from "@/types/admin";
import { MerchantDetail } from "./MerchantDetail";
import { MerchantTable } from "./MerchantTable";
import { VerificationQueue } from "./VerificationQueue";

const penuh: C = { wa_valid: true, address: true, pickup_point: true, active_menu: true, menu_with_photo: true, opening_hours: true };
const antrian = (o: Partial<AntrianPenjual>): AntrianPenjual => ({
  id: 1, business_name: "Dapur Siti", owner_name: "Siti", wa_number: "081298765432", verification_status: "pending",
  created_at: "2026-10-30T03:00:00.000Z", verification_note: null, checklist: penuh, updated_after_note: false, ...o,
});

beforeEach(() => {
  refresh.mockReset(); replace.mockReset(); url.q = "status=pending";
  aksiPenjual.mockReset().mockResolvedValue({ data: null });
});

describe("antrean verifikasi", () => {
  it("kosong -> EmptyState", () => {
    render(<VerificationQueue rows={[]} />);
    expect(screen.getByText("Tidak ada penjual yang menunggu verifikasi")).toBeInTheDocument();
  });
  it("urutan dari backend dipertahankan; WA tautan aman; checklist ikon+teks; label Diperbarui penjual", () => {
    render(<VerificationQueue rows={[antrian({ id: 1, business_name: "Tertua" }), antrian({ id: 2, business_name: "Baru", updated_after_note: true, checklist: { ...penuh, active_menu: false } })]} />);
    expect(screen.getAllByRole("link", { name: /Tertua|Baru/ }).map((a) => a.textContent)).toEqual(["Tertua", "Baru"]);
    const wa = screen.getAllByRole("link", { name: "0812-9876-5432" })[0];
    expect(wa).toHaveAttribute("href", "https://wa.me/6281298765432");
    expect(wa).toHaveAttribute("target", "_blank");
    expect(wa.getAttribute("rel")).toContain("noopener");
    expect(screen.getAllByText("Diperbarui penjual")).toHaveLength(1);
    expect(screen.getAllByText("Ada menu aktif")[1].parentElement).toHaveTextContent("belum terpenuhi");
    expect(screen.getAllByText("Menunggu").length).toBe(2);
  });
  it("checklist lengkap: Verifikasi langsung dikirim", async () => {
    render(<VerificationQueue rows={[antrian({})]} />);
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    expect(aksiPenjual).toHaveBeenCalledWith(1, "verify", undefined);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
  it("checklist belum lengkap: konfirmasi peringatan dulu", async () => {
    render(<VerificationQueue rows={[antrian({ checklist: { ...penuh, address: false } })]} />);
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    expect(aksiPenjual).not.toHaveBeenCalled();
    expect(screen.getByText("Checklist belum lengkap. Tetap verifikasi?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tetap verifikasi" }));
    expect(aksiPenjual).toHaveBeenCalledWith(1, "verify", undefined);
  });
  it("Tangguhkan: alasan wajib, ada penghitung /500, dikirim terpangkas", async () => {
    render(<VerificationQueue rows={[antrian({})]} />);
    await userEvent.click(screen.getByRole("button", { name: "Tangguhkan" }));
    const dlg = within(screen.getByRole("dialog", { name: "Tangguhkan penjual" }));
    const kirim = dlg.getByRole("button", { name: "Tangguhkan" });
    expect(kirim).toBeDisabled();
    expect(dlg.getByText("0/500", { exact: false })).toBeInTheDocument();
    fireEvent.change(dlg.getByRole("textbox"), { target: { value: "  Menu palsu " } });
    expect(dlg.getByText("13/500", { exact: false })).toBeInTheDocument();
    await userEvent.click(kirim);
    expect(aksiPenjual).toHaveBeenCalledWith(1, "suspend", "Menu palsu");
  });
  it("Minta perbaiki hanya untuk status menunggu", () => {
    render(<VerificationQueue rows={[antrian({}), antrian({ id: 2, verification_status: "needs_fix" })]} />);
    expect(screen.getAllByRole("button", { name: "Minta perbaiki" })).toHaveLength(1);
  });
  it("409: toast + refresh", async () => {
    aksiPenjual.mockResolvedValue({ error: { code: "CONFLICT", message: "Status penjual sudah berubah." } });
    render(<><Toaster /><VerificationQueue rows={[antrian({})]} /></>);
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    await waitFor(() => expect(screen.getByText(/Status penjual sudah berubah/)).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
  });
});

const detail = (o: Partial<DetailPenjual>): DetailPenjual => ({
  id: 7, business_name: "Dapur Siti", address: "Jl. Mawar 1", wa_number: "081298765432", open_time: "08:00:00", close_time: "17:00:00",
  verification_status: "verified", verification_note: null, suspended_reason: null, is_open: true, created_at: "2026-10-30T03:00:00.000Z",
  merchant_type_name: "Katering Rumahan", menu_count: 5,
  owner: { full_name: "Siti", phone: "081298765432", email: "siti@mail.com" }, pickup_points: [{ id: 1, name: "Kantin A" }],
  checklist: penuh,
  recent_logs: [{ id: 1, admin_user_id: 9, admin_name: "Dina", target_type: "merchant", target_id: "1", action: "merchant.verify", reason: null, before: { verification_status: "pending" }, after: { verification_status: "verified" }, created_at: "2026-10-31T03:00:00.000Z" }],
  ...o,
});
const tombol = () => screen.queryAllByRole("button").map((b) => b.textContent);

describe("dialog aksi", () => {
  const tahan = () => { let selesai!: (v: unknown) => void; aksiPenjual.mockReturnValue(new Promise((r) => { selesai = r; })); return selesai; };
  it("kirim ganda dicegah: tombol dinonaktifkan selama menunggu", async () => {
    const selesai = tahan();
    render(<VerificationQueue rows={[antrian({})]} />);
    await userEvent.click(screen.getByRole("button", { name: "Tangguhkan" }));
    const dlg = within(screen.getByRole("dialog", { name: "Tangguhkan penjual" }));
    fireEvent.change(dlg.getByRole("textbox"), { target: { value: "Menu palsu" } });
    const kirim = dlg.getByRole("button", { name: "Tangguhkan" });
    await userEvent.click(kirim);
    expect(kirim).toBeDisabled();
    await userEvent.click(kirim);
    expect(aksiPenjual).toHaveBeenCalledTimes(1);
    await act(async () => selesai({ data: null }));
  });
  it("gagal: dialog tetap terbuka dengan alasan terisi; berhasil: menutup", async () => {
    aksiPenjual.mockResolvedValueOnce({ error: { code: "INTERNAL_ERROR", message: "Gagal." } });
    render(<><Toaster /><VerificationQueue rows={[antrian({})]} /></>);
    await userEvent.click(screen.getByRole("button", { name: "Tangguhkan" }));
    const dlg = within(screen.getByRole("dialog", { name: "Tangguhkan penjual" }));
    fireEvent.change(dlg.getByRole("textbox"), { target: { value: "Menu palsu" } });
    await userEvent.click(dlg.getByRole("button", { name: "Tangguhkan" }));
    await waitFor(() => expect(screen.getByText("Gagal.")).toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Tangguhkan penjual" })).toBeInTheDocument();
    expect(dlg.getByRole("textbox")).toHaveValue("Menu palsu");
    expect(dlg.getByRole("button", { name: "Tangguhkan" })).toBeEnabled();
    await userEvent.click(dlg.getByRole("button", { name: "Tangguhkan" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tangguhkan penjual" })).toBeNull());
    expect(refresh).toHaveBeenCalled();
  });
  it("Aktifkan lagi meminta konfirmasi dulu", async () => {
    render(<MerchantDetail m={detail({ verification_status: "suspended" })} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan lagi" }));
    expect(aksiPenjual).not.toHaveBeenCalled();
    const dlg = within(screen.getByRole("dialog", { name: "Aktifkan lagi toko" }));
    expect(dlg.getByText("Aktifkan lagi toko ini? Toko akan terlihat oleh pembeli.")).toBeInTheDocument();
    await userEvent.click(dlg.getByRole("button", { name: "Aktifkan lagi" }));
    expect(aksiPenjual).toHaveBeenCalledWith(7, "reactivate", undefined);
  });
});

describe("detail penjual", () => {
  it("profil, log toko, tautan ke log penuh", () => {
    render(<MerchantDetail m={detail({})} />);
    expect(screen.getByText("Jl. Mawar 1")).toBeInTheDocument();
    expect(screen.getByText("Kantin A")).toBeInTheDocument();
    expect(screen.getByText("siti@mail.com")).toBeInTheDocument();
    expect(screen.getByText("Katering Rumahan")).toBeInTheDocument();
    expect(screen.getByText("5 menu aktif")).toBeInTheDocument();
    expect(screen.getByText("Status verifikasi: Menunggu → Terverifikasi")).toBeInTheDocument();
    expect(screen.getByText(/Verifikasi penjual · Dina/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lihat semua log toko ini" })).toHaveAttribute("href", "/admin/log?target_type=merchant&target_id=7");
  });
  it("aksi sesuai status (K1)", () => {
    const hasil = (s: DetailPenjual["verification_status"]) => { const v = render(<MerchantDetail m={detail({ verification_status: s })} />); const t = tombol(); v.unmount(); return t; };
    expect(hasil("verified")).toEqual(["Tangguhkan", "Tutup hari ini"]);
    expect(hasil("suspended")).toEqual(["Aktifkan lagi"]);
    expect(hasil("pending")).toEqual(["Verifikasi", "Minta perbaiki", "Tangguhkan"]);
    expect(hasil("needs_fix")).toEqual(["Verifikasi", "Tangguhkan"]);
  });
  it("catatan & alasan tampil", () => {
    render(<MerchantDetail m={detail({ verification_status: "suspended", suspended_reason: "Menu palsu" })} />);
    expect(screen.getByText("Alasan penangguhan: Menu palsu")).toBeInTheDocument();
    expect(screen.getByText("Ditangguhkan")).toBeInTheDocument();
  });
});

describe("daftar penjual", () => {
  const row = (o: Partial<PenjualRingkas>): PenjualRingkas => ({ id: 3, business_name: "Dapur A", owner_name: "Ani", wa_number: "081111111111", verification_status: "verified", is_open: true, menu_count: 4, created_at: "2026-10-30T03:00:00.000Z", ...o });
  it("baris menaut ke detail; pencarian ditunda ke URL; filter ubah URL", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MerchantTable rows={[row({})]} page={1} total={1} tersaring />);
    expect(screen.getAllByRole("link", { name: /Dapur A/ })[0]).toHaveAttribute("href", "/admin/penjual/3");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: " siti " } });
    expect(replace).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(450); });
    expect(replace).toHaveBeenCalledWith("/admin/penjual?status=pending&q=siti", { scroll: false });
    vi.useRealTimers();
    fireEvent.change(screen.getByLabelText("Dapur"), { target: { value: "1" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/penjual?status=pending&open=1&q=siti", { scroll: false });
  });
  it("Hapus filter mengosongkan kotak cari; Back/URL luar menyamakan kotak", async () => {
    url.q = "q=siti&status=pending";
    const v = render(<MerchantTable rows={[]} page={1} total={0} tersaring />);
    expect(screen.getByRole("searchbox")).toHaveValue("siti");
    await userEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(replace).toHaveBeenCalledWith("/admin/penjual", { scroll: false });
    url.q = "q=budi";
    v.rerender(<MerchantTable rows={[]} page={1} total={0} tersaring />);
    expect(screen.getByRole("searchbox")).toHaveValue("budi");
  });
  it("q diketik lalu filter diubah sebelum jeda habis: keduanya terkirim, timer batal", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MerchantTable rows={[row({})]} page={1} total={1} tersaring />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bu" } });
    fireEvent.change(screen.getByLabelText("Dapur"), { target: { value: "1" } });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/admin/penjual?status=pending&open=1&q=bu", { scroll: false });
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(replace).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it("kosong dengan filter -> Penjual tidak ditemukan", () => {
    render(<MerchantTable rows={[]} page={1} total={0} tersaring />);
    expect(screen.getByText("Penjual tidak ditemukan")).toBeInTheDocument();
  });
});

describe("banner status toko (R-15)", () => {
  it("pending", () => {
    render(<StatusToko merchant={{ verification_status: "pending" }} />);
    expect(screen.getByText("Toko Anda sedang diperiksa admin. Setelah terverifikasi, toko Anda bisa ditampilkan ke pembeli.")).toBeInTheDocument();
  });
  it("needs_fix: catatan + tautan pengaturan", () => {
    render(<StatusToko merchant={{ verification_status: "needs_fix", verification_note: "Foto buram" }} />);
    expect(screen.getByText(/Admin meminta perbaikan: Foto buram/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lengkapi pengaturan" })).toHaveAttribute("href", "/pengaturan");
  });
  it("suspended: alasan bila ada, umum bila tidak", () => {
    const { unmount } = render(<StatusToko merchant={{ verification_status: "suspended", suspended_reason: "Menu palsu" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Toko Anda ditangguhkan: Menu palsu");
    unmount();
    render(<StatusToko merchant={{ verification_status: "suspended", suspended_reason: null }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Toko Anda ditangguhkan.");
  });
  it("verified atau tanpa data: tanpa banner", () => {
    const { container } = render(<StatusToko merchant={{ verification_status: "verified" }} />);
    expect(container).toBeEmptyDOMElement();
    expect(render(<StatusToko merchant={null} />).container).toBeEmptyDOMElement();
  });
});
