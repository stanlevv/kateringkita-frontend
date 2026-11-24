// Test MerchantBanners: keadaan kosong, banner menunggu menyembunyikan tombol ajukan, alasan penolakan, status
// berakhir, dan ajukan ulang. Router dan server action dipalsukan (vi.mock).
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/banner", () => ({
  saveMerchantBanner: vi.fn(),
  deleteMerchantBanner: vi.fn().mockResolvedValue({ data: { id: 1 } }),
}));
vi.mock("@/lib/upload", () => ({ uploadPhoto: vi.fn() }));
import type { Banner } from "@/types/banner";
import { MerchantBanners } from "./MerchantBanners";

const later = new Date(Date.now() + 3 * 86400e3).toISOString();
const earlier = new Date(Date.now() - 86400e3).toISOString();
const makeBanner = (overrides: Partial<Banner>): Banner => ({
  id: 1,
  title: "Diskon pembukaan",
  image_url: "https://foto.test/x.png",
  target: "merchant",
  promo: null,
  merchant: null,
  status: "menunggu",
  catatan: null,
  starts_at: earlier,
  ends_at: later,
  sort_order: 0,
  reviewed_at: null,
  created_at: earlier,
  ...overrides,
});

beforeEach(() => refresh.mockReset());

describe("MerchantBanners", () => {
  it("kosong: ajakan + tombol Ajukan banner membuka form", async () => {
    render(<MerchantBanners banners={[]} vouchers={[]} />);
    expect(screen.getByText("Belum ada banner")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ajukan banner" }));
    expect(screen.getByLabelText(/Judul/)).toBeInTheDocument();
  });

  it("banner aktif menunggu: status, tanpa tombol ajukan baru", () => {
    render(<MerchantBanners banners={[makeBanner({})]} vouchers={[]} />);
    const card = within(screen.getByRole("article"));
    expect(card.getByText("Menunggu persetujuan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ajukan banner" })).not.toBeInTheDocument();
  });

  it("ditolak: alasan admin + Ajukan ulang; tayang: label Tayang", async () => {
    render(
      <MerchantBanners
        banners={[
          makeBanner({ status: "ditolak", catatan: "Gambar buram" }),
          makeBanner({ id: 2, status: "disetujui", title: "Banner lama", ends_at: earlier }),
        ]}
        vouchers={[]}
      />,
    );
    expect(screen.getByText("Alasan admin: Gambar buram")).toBeInTheDocument();
    expect(screen.getByText("Berakhir")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ajukan ulang" }));
    expect((screen.getByLabelText(/Judul/) as HTMLInputElement).value).toBe("Diskon pembukaan");
  });

  it("diarsipkan admin: label netral, tanpa ubah/ajukan ulang, tombol Ajukan banner muncul, hapus tetap ada", () => {
    const archivedAt = new Date().toISOString();
    render(
      <MerchantBanners
        banners={[
          makeBanner({ status: "disetujui", archived_at: archivedAt }),
          makeBanner({ id: 2, status: "ditolak", title: "Banner ditolak", archived_at: archivedAt }),
        ]}
        vouchers={[]}
      />,
    );
    expect(screen.getAllByText("Diarsipkan admin")).toHaveLength(2);
    expect(screen.queryByText("Tayang")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ajukan ulang" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Hapus" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Ajukan banner" })).toBeInTheDocument();
  });
});
