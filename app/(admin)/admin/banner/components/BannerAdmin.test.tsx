import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const tinjauBannerAdmin = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/banner", () => ({
  tinjauBannerAdmin: (...a: unknown[]) => tinjauBannerAdmin(...a), buatBannerAdmin: vi.fn(), mintaUnggahAdmin: vi.fn(),
}));
vi.mock("@/lib/unggah", () => ({ unggahFoto: vi.fn() }));
import { Toaster } from "@/app/components/ui/Toast";
import type { Banner } from "@/types/banner";
import { BannerAdmin } from "./BannerAdmin";

const nanti = new Date(Date.now() + 3 * 86400e3).toISOString();
const lalu = new Date(Date.now() - 86400e3).toISOString();
const b = (p: Partial<Banner>): Banner => ({
  id: 1, title: "Diskon Dapur Siti", image_url: "https://foto.test/x.png", target: "merchant", promo: null,
  merchant: { id: 3, slug: "dapur-siti", business_name: "Dapur Siti" }, status: "menunggu", catatan: null, starts_at: lalu, ends_at: nanti,
  sort_order: 0, reviewed_at: null, created_at: lalu, ...p,
});

beforeEach(() => {
  refresh.mockReset();
  tinjauBannerAdmin.mockReset().mockResolvedValue({ data: { id: 1 } });
});

describe("BannerAdmin", () => {
  it("antrean penjual: setujui → aksi + toast + muat ulang", async () => {
    render(<><Toaster /><BannerAdmin banners={[b({})]} vouchers={[]} bolehUbah /></>);
    const k = within(screen.getByRole("article"));
    expect(k.getByText("Dapur Siti")).toBeInTheDocument();
    await userEvent.click(k.getByRole("button", { name: "Setujui" }));
    expect(tinjauBannerAdmin).toHaveBeenCalledWith(1, { status: "disetujui" });
    expect(await screen.findByText("Banner disetujui.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("tolak wajib alasan di kolomnya; dengan alasan terkirim", async () => {
    render(<><Toaster /><BannerAdmin banners={[b({})]} vouchers={[]} bolehUbah /></>);
    const k = within(screen.getByRole("article"));
    await userEvent.click(k.getByRole("button", { name: "Tolak" }));
    expect(k.getByText("Tulis alasan penolakan (3–300 karakter).")).toBeInTheDocument();
    expect(tinjauBannerAdmin).not.toHaveBeenCalled();
    await userEvent.type(k.getByLabelText(/Alasan penolakan/), "Gambar buram");
    await userEvent.click(k.getByRole("button", { name: "Tolak" }));
    expect(tinjauBannerAdmin).toHaveBeenCalledWith(1, { status: "ditolak", catatan: "Gambar buram" });
  });

  it("banner tayang: Nonaktifkan; support hanya melihat; tombol buat banner platform", async () => {
    const { unmount } = render(<BannerAdmin banners={[b({ status: "disetujui", merchant: null, title: "Voucher KateringKita" })]} vouchers={[]} bolehUbah />);
    expect(screen.getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Buat banner platform" }));
    expect(screen.getByLabelText(/Urutan tampil/)).toBeInTheDocument();
    unmount();
    render(<BannerAdmin banners={[b({})]} vouchers={[]} bolehUbah={false} />);
    expect(screen.queryByRole("button", { name: "Setujui" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buat banner platform" })).not.toBeInTheDocument();
  });
});
