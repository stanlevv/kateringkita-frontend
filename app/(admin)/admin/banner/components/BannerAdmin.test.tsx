import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const reviewAdminBanner = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/banner", () => ({
  reviewAdminBanner: (...args: unknown[]) => reviewAdminBanner(...args),
  createAdminBanner: vi.fn(),
  requestAdminUpload: vi.fn(),
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
});
