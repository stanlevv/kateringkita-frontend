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
import { BannerToko } from "./MerchantBanners";

const nanti = new Date(Date.now() + 3 * 86400e3).toISOString();
const lalu = new Date(Date.now() - 86400e3).toISOString();
const b = (p: Partial<Banner>): Banner => ({
  id: 1,
  title: "Diskon pembukaan",
  image_url: "https://foto.test/x.png",
  target: "merchant",
  promo: null,
  merchant: null,
  status: "menunggu",
  catatan: null,
  starts_at: lalu,
  ends_at: nanti,
  sort_order: 0,
  reviewed_at: null,
  created_at: lalu,
  ...p,
});

beforeEach(() => refresh.mockReset());

describe("BannerToko", () => {
  it("kosong: ajakan + tombol Ajukan banner membuka form", async () => {
    render(<BannerToko banners={[]} vouchers={[]} />);
    expect(screen.getByText("Belum ada banner")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ajukan banner" }));
    expect(screen.getByLabelText(/Judul/)).toBeInTheDocument();
  });

  it("banner aktif menunggu: status, tanpa tombol ajukan baru", () => {
    render(<BannerToko banners={[b({})]} vouchers={[]} />);
    const k = within(screen.getByRole("article"));
    expect(k.getByText("Menunggu persetujuan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ajukan banner" })).not.toBeInTheDocument();
  });

  it("ditolak: alasan admin + Ajukan ulang; tayang: label Tayang", async () => {
    render(
      <BannerToko
        banners={[
          b({ status: "ditolak", catatan: "Gambar buram" }),
          b({ id: 2, status: "disetujui", title: "Banner lama", ends_at: lalu }),
        ]}
        vouchers={[]}
      />,
    );
    expect(screen.getByText("Alasan admin: Gambar buram")).toBeInTheDocument();
    expect(screen.getByText("Berakhir")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ajukan ulang" }));
    expect((screen.getByLabelText(/Judul/) as HTMLInputElement).value).toBe("Diskon pembukaan");
  });
});
