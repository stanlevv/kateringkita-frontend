// Test komponen penjual admin: VerificationQueue, AdminActionDialog, MerchantDetail, MerchantTable, dan
// VerificationBanner (banner status toko di panel penjual).
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const replace = vi.fn();
const applyMerchantAction = vi.fn();
const url = vi.hoisted(() => ({ search: "status=pending" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace, push: vi.fn() }),
  usePathname: () => "/admin/penjual",
  useSearchParams: () => new URLSearchParams(url.search),
}));
vi.mock("@/app/actions/admin/merchants", () => ({
  applyMerchantAction: (...args: unknown[]) => applyMerchantAction(...args),
}));
import { Toaster } from "@/app/components/ui/Toast";
import { VerificationBanner } from "@/app/components/VerificationBanner";
import type {
  VerificationQueueItem,
  Checklist as ChecklistData,
  AdminMerchantDetail,
  MerchantSummary,
} from "@/types/admin";
import { MerchantDetail } from "./MerchantDetail";
import { MerchantTable } from "./MerchantTable";
import { VerificationQueue } from "./VerificationQueue";

const fullChecklist: ChecklistData = {
  wa_valid: true,
  address: true,
  pickup_point: true,
  active_menu: true,
  menu_with_photo: true,
  opening_hours: true,
};
const queueItem = (overrides: Partial<VerificationQueueItem>): VerificationQueueItem => ({
  id: 1,
  business_name: "Dapur Siti",
  owner_name: "Siti",
  wa_number: "081298765432",
  verification_status: "pending",
  created_at: "2026-10-30T03:00:00.000Z",
  verification_note: null,
  checklist: fullChecklist,
  updated_after_note: false,
  ...overrides,
});

beforeEach(() => {
  refresh.mockReset();
  replace.mockReset();
  url.search = "status=pending";
  applyMerchantAction.mockReset().mockResolvedValue({ data: null });
});

describe("antrean verifikasi", () => {
  it("kosong -> EmptyState", () => {
    render(<VerificationQueue rows={[]} />);
    expect(screen.getByText("Tidak ada penjual yang menunggu verifikasi")).toBeInTheDocument();
  });
  it("urutan dari backend dipertahankan; WA tautan aman; checklist ikon+teks; label Diperbarui penjual", () => {
    render(
      <VerificationQueue
        rows={[
          queueItem({ id: 1, business_name: "Tertua" }),
          queueItem({
            id: 2,
            business_name: "Baru",
            updated_after_note: true,
            checklist: { ...fullChecklist, active_menu: false },
          }),
        ]}
      />,
    );
    expect(screen.getAllByRole("link", { name: /Tertua|Baru/ }).map((link) => link.textContent)).toEqual([
      "Tertua",
      "Baru",
    ]);
    const whatsappLink = screen.getAllByRole("link", { name: "0812-9876-5432" })[0];
    expect(whatsappLink).toHaveAttribute("href", "https://wa.me/6281298765432");
    expect(whatsappLink).toHaveAttribute("target", "_blank");
    expect(whatsappLink.getAttribute("rel")).toContain("noopener");
    expect(screen.getAllByText("Diperbarui penjual")).toHaveLength(1);
    expect(screen.getAllByText("Ada menu aktif")[1].parentElement).toHaveTextContent("belum terpenuhi");
    expect(screen.getAllByText("Menunggu").length).toBe(2);
  });
  // Checklist diisi penjual sendiri; verifikasi sekali klik bisa dipicu clickjacking, jadi tetap lewat konfirmasi
  it("checklist lengkap: Verifikasi tetap meminta konfirmasi", async () => {
    render(<VerificationQueue rows={[queueItem({})]} />);
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    expect(applyMerchantAction).not.toHaveBeenCalled();
    const dialog = within(screen.getByRole("dialog", { name: "Verifikasi penjual" }));
    expect(
      dialog.getByText("Checklist lengkap. Verifikasi toko ini? Toko akan tampil untuk pembeli."),
    ).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Ya, verifikasi" }));
    expect(applyMerchantAction).toHaveBeenCalledWith(1, "verify", undefined);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
  it("checklist belum lengkap: konfirmasi peringatan dulu", async () => {
    render(<VerificationQueue rows={[queueItem({ checklist: { ...fullChecklist, address: false } })]} />);
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    expect(applyMerchantAction).not.toHaveBeenCalled();
    expect(screen.getByText("Checklist belum lengkap. Tetap verifikasi?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tetap verifikasi" }));
    expect(applyMerchantAction).toHaveBeenCalledWith(1, "verify", undefined);
  });
  it("Tangguhkan: alasan wajib, ada penghitung /500, dikirim terpangkas", async () => {
    render(<VerificationQueue rows={[queueItem({})]} />);
    await userEvent.click(screen.getByRole("button", { name: "Tangguhkan" }));
    const dialog = within(screen.getByRole("dialog", { name: "Tangguhkan penjual" }));
    const submitButton = dialog.getByRole("button", { name: "Tangguhkan" });
    expect(submitButton).toBeDisabled();
    expect(dialog.getByText("0/500", { exact: false })).toBeInTheDocument();
    fireEvent.change(dialog.getByRole("textbox"), { target: { value: "  Menu palsu " } });
    expect(dialog.getByText("13/500", { exact: false })).toBeInTheDocument();
    await userEvent.click(submitButton);
    expect(applyMerchantAction).toHaveBeenCalledWith(1, "suspend", "Menu palsu");
  });
  it("Minta perbaiki hanya untuk status menunggu", () => {
    render(<VerificationQueue rows={[queueItem({}), queueItem({ id: 2, verification_status: "needs_fix" })]} />);
    expect(screen.getAllByRole("button", { name: "Minta perbaiki" })).toHaveLength(1);
  });
  it("409: toast + refresh", async () => {
    applyMerchantAction.mockResolvedValue({ error: { code: "CONFLICT", message: "Status penjual sudah berubah." } });
    render(
      <>
        <Toaster />
        <VerificationQueue rows={[queueItem({})]} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    await userEvent.click(screen.getByRole("button", { name: "Ya, verifikasi" }));
    await waitFor(() => expect(screen.getByText(/Status penjual sudah berubah/)).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
  });
});

const merchantDetail = (overrides: Partial<AdminMerchantDetail>): AdminMerchantDetail => ({
  id: 7,
  business_name: "Dapur Siti",
  address: "Jl. Mawar 1",
  wa_number: "081298765432",
  open_time: "08:00:00",
  close_time: "17:00:00",
  verification_status: "verified",
  verification_note: null,
  suspended_reason: null,
  is_open: true,
  created_at: "2026-10-30T03:00:00.000Z",
  merchant_type_name: "Katering Rumahan",
  menu_count: 5,
  owner: { full_name: "Siti", phone: "081298765432", email: "siti@mail.com" },
  pickup_points: [{ id: 1, name: "Kantin A" }],
  checklist: fullChecklist,
  recent_logs: [
    {
      id: 1,
      admin_user_id: 9,
      admin_name: "Dina",
      target_type: "merchant",
      target_id: "1",
      action: "merchant.verify",
      reason: null,
      before: { verification_status: "pending" },
      after: { verification_status: "verified" },
      created_at: "2026-10-31T03:00:00.000Z",
    },
  ],
  ...overrides,
});
const buttonLabels = () => screen.queryAllByRole("button").map((button) => button.textContent);

describe("dialog aksi", () => {
  const holdAction = () => {
    let finish!: (value: unknown) => void;
    applyMerchantAction.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    return finish;
  };
  it("kirim ganda dicegah: tombol dinonaktifkan selama menunggu", async () => {
    const finish = holdAction();
    render(<VerificationQueue rows={[queueItem({})]} />);
    await userEvent.click(screen.getByRole("button", { name: "Tangguhkan" }));
    const dialog = within(screen.getByRole("dialog", { name: "Tangguhkan penjual" }));
    fireEvent.change(dialog.getByRole("textbox"), { target: { value: "Menu palsu" } });
    const submitButton = dialog.getByRole("button", { name: "Tangguhkan" });
    await userEvent.click(submitButton);
    expect(submitButton).toBeDisabled();
    await userEvent.click(submitButton);
    expect(applyMerchantAction).toHaveBeenCalledTimes(1);
    await act(async () => finish({ data: null }));
  });
  it("gagal: dialog tetap terbuka dengan alasan terisi; berhasil: menutup", async () => {
    applyMerchantAction.mockResolvedValueOnce({ error: { code: "INTERNAL_ERROR", message: "Gagal." } });
    render(
      <>
        <Toaster />
        <VerificationQueue rows={[queueItem({})]} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tangguhkan" }));
    const dialog = within(screen.getByRole("dialog", { name: "Tangguhkan penjual" }));
    fireEvent.change(dialog.getByRole("textbox"), { target: { value: "Menu palsu" } });
    await userEvent.click(dialog.getByRole("button", { name: "Tangguhkan" }));
    await waitFor(() => expect(screen.getByText("Gagal.")).toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Tangguhkan penjual" })).toBeInTheDocument();
    expect(dialog.getByRole("textbox")).toHaveValue("Menu palsu");
    expect(dialog.getByRole("button", { name: "Tangguhkan" })).toBeEnabled();
    await userEvent.click(dialog.getByRole("button", { name: "Tangguhkan" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tangguhkan penjual" })).toBeNull());
    expect(refresh).toHaveBeenCalled();
  });
  it("Aktifkan lagi meminta konfirmasi dulu", async () => {
    render(<MerchantDetail merchant={merchantDetail({ verification_status: "suspended" })} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan lagi" }));
    expect(applyMerchantAction).not.toHaveBeenCalled();
    const dialog = within(screen.getByRole("dialog", { name: "Aktifkan lagi toko" }));
    expect(dialog.getByText("Aktifkan lagi toko ini? Toko akan terlihat oleh pembeli.")).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Aktifkan lagi" }));
    expect(applyMerchantAction).toHaveBeenCalledWith(7, "reactivate", undefined);
  });
});

describe("detail penjual", () => {
  it("profil, log toko, tautan ke log penuh", () => {
    render(<MerchantDetail merchant={merchantDetail({})} />);
    expect(screen.getByText("Jl. Mawar 1")).toBeInTheDocument();
    expect(screen.getByText("Kantin A")).toBeInTheDocument();
    expect(screen.getByText("siti@mail.com")).toBeInTheDocument();
    expect(screen.getByText("Katering Rumahan")).toBeInTheDocument();
    expect(screen.getByText("5 menu aktif")).toBeInTheDocument();
    expect(screen.getByText("Status verifikasi: Menunggu → Terverifikasi")).toBeInTheDocument();
    expect(screen.getByText(/Verifikasi penjual · Dina/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lihat semua log toko ini" })).toHaveAttribute(
      "href",
      "/admin/log?target_type=merchant&target_id=7",
    );
  });
  it("tombol aksi sesuai status verifikasi penjual", () => {
    const buttonsFor = (status: AdminMerchantDetail["verification_status"]) => {
      const view = render(<MerchantDetail merchant={merchantDetail({ verification_status: status })} />);
      const labels = buttonLabels();
      view.unmount();
      return labels;
    };
    expect(buttonsFor("verified")).toEqual(["Tangguhkan", "Tutup hari ini"]);
    expect(buttonsFor("suspended")).toEqual(["Aktifkan lagi"]);
    expect(buttonsFor("pending")).toEqual(["Verifikasi", "Minta perbaiki", "Tangguhkan"]);
    expect(buttonsFor("needs_fix")).toEqual(["Verifikasi", "Tangguhkan"]);
  });
  it("catatan & alasan tampil", () => {
    render(
      <MerchantDetail
        merchant={merchantDetail({ verification_status: "suspended", suspended_reason: "Menu palsu" })}
      />,
    );
    expect(screen.getByText("Alasan penangguhan: Menu palsu")).toBeInTheDocument();
    expect(screen.getByText("Ditangguhkan")).toBeInTheDocument();
  });
});

describe("daftar penjual", () => {
  const row = (overrides: Partial<MerchantSummary>): MerchantSummary => ({
    id: 3,
    business_name: "Dapur A",
    owner_name: "Ani",
    wa_number: "081111111111",
    verification_status: "verified",
    is_open: true,
    menu_count: 4,
    created_at: "2026-10-30T03:00:00.000Z",
    ...overrides,
  });
  it("baris menaut ke detail; pencarian ditunda ke URL; filter ubah URL", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MerchantTable rows={[row({})]} page={1} total={1} filtered />);
    expect(screen.getAllByRole("link", { name: /Dapur A/ })[0]).toHaveAttribute("href", "/admin/penjual/3");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: " siti " } });
    expect(replace).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(450);
    });
    expect(replace).toHaveBeenCalledWith("/admin/penjual?status=pending&q=siti", { scroll: false });
    vi.useRealTimers();
    fireEvent.change(screen.getByLabelText("Dapur"), { target: { value: "1" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/penjual?status=pending&open=1&q=siti", { scroll: false });
  });
  it("Hapus filter mengosongkan kotak cari; Back/URL luar menyamakan kotak", async () => {
    url.search = "q=siti&status=pending";
    const view = render(<MerchantTable rows={[]} page={1} total={0} filtered />);
    expect(screen.getByRole("searchbox")).toHaveValue("siti");
    await userEvent.click(screen.getByRole("button", { name: "Hapus filter" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(replace).toHaveBeenCalledWith("/admin/penjual", { scroll: false });
    url.search = "q=budi";
    view.rerender(<MerchantTable rows={[]} page={1} total={0} filtered />);
    expect(screen.getByRole("searchbox")).toHaveValue("budi");
  });
  it("q diketik lalu filter diubah sebelum jeda habis: keduanya terkirim, timer batal", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<MerchantTable rows={[row({})]} page={1} total={1} filtered />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bu" } });
    fireEvent.change(screen.getByLabelText("Dapur"), { target: { value: "1" } });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/admin/penjual?status=pending&open=1&q=bu", { scroll: false });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it("kosong dengan filter -> Penjual tidak ditemukan", () => {
    render(<MerchantTable rows={[]} page={1} total={0} filtered />);
    expect(screen.getByText("Penjual tidak ditemukan")).toBeInTheDocument();
  });
});

describe("banner status toko", () => {
  it("pending", () => {
    render(<VerificationBanner merchant={{ verification_status: "pending" }} />);
    expect(
      screen.getByText(
        "Toko Anda sedang diperiksa admin. Setelah terverifikasi, toko Anda bisa ditampilkan ke pembeli.",
      ),
    ).toBeInTheDocument();
  });
  it("needs_fix: catatan + tautan pengaturan", () => {
    render(<VerificationBanner merchant={{ verification_status: "needs_fix", verification_note: "Foto buram" }} />);
    expect(screen.getByText(/Admin meminta perbaikan: Foto buram/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lengkapi pengaturan" })).toHaveAttribute("href", "/pengaturan");
  });
  it("suspended: alasan bila ada, umum bila tidak", () => {
    const { unmount } = render(
      <VerificationBanner merchant={{ verification_status: "suspended", suspended_reason: "Menu palsu" }} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Toko Anda ditangguhkan: Menu palsu");
    unmount();
    render(<VerificationBanner merchant={{ verification_status: "suspended", suspended_reason: null }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Toko Anda ditangguhkan.");
  });
  it("verified atau tanpa data: tanpa banner", () => {
    const { container } = render(<VerificationBanner merchant={{ verification_status: "verified" }} />);
    expect(container).toBeEmptyDOMElement();
    expect(render(<VerificationBanner merchant={null} />).container).toBeEmptyDOMElement();
  });
});
