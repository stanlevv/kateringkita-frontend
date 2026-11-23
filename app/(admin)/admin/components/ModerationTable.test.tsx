// Test ModerationTable: sembunyikan ulasan dengan alasan, pulihkan menu lewat konfirmasi, kolom foto, dan hapus foto.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/app/components/ui/Toast";
import { ModerationTable } from "./ModerationTable";
import type { ModerationMenu, ModerationReview } from "@/types/admin";

const moderate = vi.fn();
const deleteMenuPhoto = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/admin/moderation", () => ({
  moderate: (...args: unknown[]) => moderate(...args),
  deleteMenuPhoto: (...args: unknown[]) => deleteMenuPhoto(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const review: ModerationReview = {
  id: 5,
  rating: 1,
  comment: "Spam judi",
  created_at: "2026-11-01T03:00:00.000Z",
  hidden: false,
  hidden_at: null,
  hidden_reason: null,
  menu: { id: 1, name: "Nasi Ayam" },
  merchant: { id: 2, business_name: "Dapur Siti" },
  customer_name: "Budi",
  order_code: "KK-20261101-AAAA",
};
const menu: ModerationMenu = {
  id: 9,
  name: "Es Teh",
  price: 5000,
  image_url: null,
  is_active: false,
  moderated: true,
  moderated_at: "2026-11-01T03:00:00.000Z",
  moderation_reason: "Foto melanggar",
  created_at: "2026-10-01T03:00:00.000Z",
  merchant: { id: 2, business_name: "Dapur Siti" },
};

beforeEach(() => {
  moderate.mockReset();
  deleteMenuPhoto.mockReset();
  refresh.mockReset();
  moderate.mockResolvedValue({ data: {} });
});

describe("ModerationTable (moderasi ulasan dan menu)", () => {
  it("sembunyikan ulasan: dialog alasan, tombol mati sampai diisi, lalu refresh", async () => {
    render(
      <>
        <ModerationTable kind="ulasan" rows={[review]} />
        <Toaster />
      </>,
    );
    expect(screen.getByText("Tampil")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan" }));
    const submitButton = screen.getAllByRole("button", { name: "Sembunyikan" }).at(-1)!;
    expect(submitButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Alasan/), { target: { value: " Spam " } });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(moderate).toHaveBeenCalledWith(5, "hide", "Spam");
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText("Ulasan disembunyikan.")).toBeInTheDocument();
  });
  // Pulihkan tidak jalan dengan sekali klik
  it("menu diturunkan: alasan tampil, pulihkan lewat konfirmasi", async () => {
    render(
      <>
        <ModerationTable kind="menu" rows={[menu]} />
        <Toaster />
      </>,
    );
    expect(screen.getByText("Foto melanggar")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pulihkan" }));
    });
    expect(moderate).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Ya, pulihkan" }));
    });
    expect(moderate).toHaveBeenCalledWith(9, "restore", undefined);
  });
  it("kolom Foto: foto utama lalu foto tambahan, tiap foto membuka ukuran penuh; tanpa foto → teks", () => {
    const gallery = ["https://foto.test/b.jpg", "https://foto.test/c.jpg"];
    const { unmount } = render(
      <ModerationTable kind="menu" rows={[{ ...menu, image_url: "https://foto.test/a.jpg", gallery }]} />,
    );
    const links = screen.getAllByRole("link", { name: /Buka foto/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["https://foto.test/a.jpg", ...gallery]);
    expect(links[0]).toHaveAccessibleName("Buka foto 1 Es Teh (utama)");
    expect(links[0]).toHaveAttribute("target", "_blank");
    unmount();
    render(<ModerationTable kind="menu" rows={[menu]} />);
    expect(screen.getByText("Tanpa foto")).toBeInTheDocument();
  });
  it("hapus satu foto: dialog alasan wajib, kirim url + alasan, lalu refresh", async () => {
    deleteMenuPhoto.mockResolvedValue({ data: { ...menu } });
    render(
      <>
        <ModerationTable
          kind="menu"
          rows={[{ ...menu, image_url: "https://foto.test/a.jpg", gallery: ["https://foto.test/b.jpg"] }]}
        />
        <Toaster />
      </>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus foto 2 Es Teh" }));
    });
    const deleteButton = screen.getByRole("button", { name: "Hapus foto" });
    expect(deleteButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Alasan/), { target: { value: " Bukan makanan " } });
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    expect(deleteMenuPhoto).toHaveBeenCalledWith(9, "https://foto.test/b.jpg", "Bukan makanan");
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText("Foto dihapus dari menu.")).toBeInTheDocument();
  });
  it("kosong -> empty state", () => {
    render(<ModerationTable kind="menu" rows={[]} />);
    expect(screen.getByText("Tidak ada data")).toBeInTheDocument();
  });
});
