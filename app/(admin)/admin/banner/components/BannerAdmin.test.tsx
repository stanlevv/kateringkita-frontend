// Test BannerAdmin: setujui lewat konfirmasi, tolak wajib alasan, nonaktifkan banner tayang, support hanya melihat,
// dialog buat banner platform, ubah isi banner platform, arsip dengan konfirmasi, dan pulihkan di tampilan Arsip.
// Server action dan unggah foto diganti tiruan (mock).
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const reviewAdminBanner = vi.fn();
const updateAdminBannerContent = vi.fn();
const setAdminBannerArchived = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/banner", () => ({
  reviewAdminBanner: (...args: unknown[]) => reviewAdminBanner(...args),
  createAdminBanner: vi.fn(),
  requestAdminUpload: vi.fn(),
  updateAdminBannerContent: (...args: unknown[]) => updateAdminBannerContent(...args),
  setAdminBannerArchived: (...args: unknown[]) => setAdminBannerArchived(...args),
}));
vi.mock("@/lib/upload", () => ({ uploadPhoto: vi.fn() }));
import { Toaster } from "@/app/components/ui/Toast";
import type { Banner } from "@/types/banner";
import { BannerAdmin } from "./BannerAdmin";

const future = new Date(Date.now() + 3 * 86400e3).toISOString();
const past = new Date(Date.now() - 86400e3).toISOString();
const makeBanner = (overrides: Partial<Banner>): Banner => ({
  id: 1,
  title: "Diskon Dapur Siti",
  image_url: "https://foto.test/x.png",
  target: "merchant",
  promo: null,
  merchant: { id: 3, slug: "dapur-siti", business_name: "Dapur Siti" },
  status: "menunggu",
  catatan: null,
  starts_at: past,
  ends_at: future,
  sort_order: 0,
  reviewed_at: null,
  created_at: past,
  ...overrides,
});

beforeEach(() => {
  refresh.mockReset();
  reviewAdminBanner.mockReset().mockResolvedValue({ data: { id: 1 } });
  updateAdminBannerContent.mockReset().mockResolvedValue({ data: { id: 1 } });
  setAdminBannerArchived.mockReset().mockResolvedValue({ data: { id: 1 } });
});

describe("BannerAdmin", () => {
  it("antrean penjual: setujui → aksi + toast + muat ulang", async () => {
    render(
      <>
        <Toaster />
        <BannerAdmin banners={[makeBanner({})]} vouchers={[]} canEdit />
      </>,
    );
    const card = within(screen.getByRole("article"));
    expect(card.getByText("Dapur Siti")).toBeInTheDocument();
    await userEvent.click(card.getByRole("button", { name: "Setujui" }));
    expect(reviewAdminBanner).not.toHaveBeenCalled(); // lewat konfirmasi dulu
    await userEvent.click(screen.getByRole("button", { name: "Ya, setujui" }));
    expect(reviewAdminBanner).toHaveBeenCalledWith(1, { status: "disetujui" });
    expect(await screen.findByText("Banner disetujui.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("tolak wajib alasan di kolomnya; dengan alasan terkirim", async () => {
    render(
      <>
        <Toaster />
        <BannerAdmin banners={[makeBanner({})]} vouchers={[]} canEdit />
      </>,
    );
    const card = within(screen.getByRole("article"));
    await userEvent.click(card.getByRole("button", { name: "Tolak" }));
    expect(card.getByText("Tulis alasan penolakan (3–300 karakter).")).toBeInTheDocument();
    expect(reviewAdminBanner).not.toHaveBeenCalled();
    await userEvent.type(card.getByLabelText(/Alasan penolakan/), "Gambar buram");
    await userEvent.click(card.getByRole("button", { name: "Tolak" }));
    expect(reviewAdminBanner).toHaveBeenCalledWith(1, { status: "ditolak", catatan: "Gambar buram" });
  });

  it("banner tayang: Nonaktifkan; support hanya melihat; tombol buat banner platform", async () => {
    const { unmount } = render(
      <BannerAdmin
        banners={[makeBanner({ status: "disetujui", merchant: null, title: "Voucher KateringKita" })]}
        vouchers={[]}
        canEdit
      />,
    );
    expect(screen.getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Buat banner platform" }));
    expect(screen.getByLabelText(/Urutan tampil/)).toBeInTheDocument();
    unmount();
    render(<BannerAdmin banners={[makeBanner({})]} vouchers={[]} canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Setujui" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buat banner platform" })).not.toBeInTheDocument();
  });

  it("banner platform: Ubah membuka BannerForm terisi → PATCH isi; banner toko tanpa Ubah", async () => {
    render(
      <>
        <Toaster />
        <BannerAdmin
          banners={[
            makeBanner({ id: 5, status: "disetujui", merchant: null, target: "none", title: "Voucher KateringKita" }),
            makeBanner({ id: 6, title: "Banner toko" }),
          ]}
          vouchers={[]}
          canEdit
        />
      </>,
    );
    expect(
      within(screen.getByRole("article", { name: "Banner toko" })).queryByRole("button", { name: "Ubah" }),
    ).toBeNull();
    await userEvent.click(
      within(screen.getByRole("article", { name: "Voucher KateringKita" })).getByRole("button", { name: "Ubah" }),
    );
    expect(screen.getByRole("dialog", { name: "Ubah banner platform" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Judul/)).toHaveValue("Voucher KateringKita");
    expect(screen.queryByLabelText(/Urutan tampil/)).toBeNull(); // urutan tidak diubah lewat dialog ini
    await userEvent.click(screen.getByRole("button", { name: "Simpan banner" }));
    await waitFor(() =>
      expect(updateAdminBannerContent).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          title: "Voucher KateringKita",
          image_url: "https://foto.test/x.png",
          target: "none",
        }),
      ),
    );
    expect(await screen.findByText("Banner disimpan.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("arsipkan banner (toko maupun platform) lewat konfirmasi", async () => {
    render(
      <>
        <Toaster />
        <BannerAdmin banners={[makeBanner({})]} vouchers={[]} canEdit />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Arsipkan" }));
    expect(setAdminBannerArchived).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Ya, arsipkan" }));
    await waitFor(() => expect(setAdminBannerArchived).toHaveBeenCalledWith(1, true));
    expect(await screen.findByText("Banner diarsipkan.")).toBeInTheDocument();
  });

  it("tampilan Arsip: label menyertakan status asal banner", () => {
    const archivedAt = past;
    render(
      <BannerAdmin
        banners={[
          makeBanner({ id: 1, status: "menunggu", archived_at: archivedAt }),
          makeBanner({ id: 2, status: "disetujui", archived_at: archivedAt }),
          makeBanner({ id: 3, status: "ditolak", archived_at: archivedAt }),
          makeBanner({ id: 4, status: "nonaktif", archived_at: archivedAt }),
        ]}
        vouchers={[]}
        canEdit
        archived
      />,
    );
    for (const origin of ["Menunggu", "Disetujui", "Ditolak", "Nonaktif"])
      expect(screen.getByText(`Diarsipkan · ${origin}`)).toBeInTheDocument();
  });

  it("tampilan Arsip: hanya Pulihkan, pesan 409 apa adanya; support tanpa tombol", async () => {
    const message = "Toko ini sudah punya banner aktif.";
    setAdminBannerArchived.mockResolvedValue({ error: { code: "CONFLICT", message } });
    const { unmount } = render(
      <>
        <Toaster />
        <BannerAdmin banners={[makeBanner({ merchant: null, status: "disetujui" })]} vouchers={[]} canEdit archived />
      </>,
    );
    for (const name of ["Buat banner platform", "Ubah", "Nonaktifkan", "Arsipkan"])
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pulihkan" }));
    expect(setAdminBannerArchived).toHaveBeenCalledWith(1, false);
    expect(await screen.findByText(message)).toBeInTheDocument();
    unmount();
    render(<BannerAdmin banners={[makeBanner({ merchant: null })]} vouchers={[]} canEdit={false} archived />);
    expect(screen.queryByRole("button", { name: "Pulihkan" })).not.toBeInTheDocument();
    render(<BannerAdmin banners={[makeBanner({ merchant: null })]} vouchers={[]} canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Arsipkan" })).not.toBeInTheDocument();
  });
});
