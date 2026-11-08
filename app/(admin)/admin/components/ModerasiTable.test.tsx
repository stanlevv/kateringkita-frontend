import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/app/components/ui/Toast";
import { ModerasiTable } from "./ModerasiTable";
import type { MenuModerasi, UlasanModerasi } from "@/types/admin";

const moderasi = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/admin/moderasi", () => ({ moderasi: (...a: unknown[]) => moderasi(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const ulasan: UlasanModerasi = {
  id: 5, rating: 1, comment: "Spam judi", created_at: "2026-11-01T03:00:00.000Z", hidden: false, hidden_at: null, hidden_reason: null,
  menu: { id: 1, name: "Nasi Ayam" }, merchant: { id: 2, business_name: "Dapur Siti" }, customer_name: "Budi", order_code: "KK-20261101-AAAA",
};
const menu: MenuModerasi = {
  id: 9, name: "Es Teh", price: 5000, image_url: null, is_active: false, moderated: true, moderated_at: "2026-11-01T03:00:00.000Z",
  moderation_reason: "Foto melanggar", created_at: "2026-10-01T03:00:00.000Z", merchant: { id: 2, business_name: "Dapur Siti" },
};

beforeEach(() => { moderasi.mockReset(); refresh.mockReset(); moderasi.mockResolvedValue({ data: {} }); });

describe("F19 ModerasiTable", () => {
  it("sembunyikan ulasan: dialog alasan, tombol mati sampai diisi, lalu refresh", async () => {
    render(<><ModerasiTable jenis="ulasan" rows={[ulasan]} /><Toaster /></>);
    expect(screen.getByText("Tampil")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan" }));
    const kirim = screen.getAllByRole("button", { name: "Sembunyikan" }).at(-1)!;
    expect(kirim).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Alasan/), { target: { value: " Spam " } });
    await act(async () => { fireEvent.click(kirim); });
    expect(moderasi).toHaveBeenCalledWith(5, "hide", "Spam");
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText("Ulasan disembunyikan.")).toBeInTheDocument();
  });
  it("menu diturunkan: alasan tampil, pulihkan langsung tanpa dialog", async () => {
    render(<><ModerasiTable jenis="menu" rows={[menu]} /><Toaster /></>);
    expect(screen.getByText("Foto melanggar")).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Pulihkan" })); });
    expect(moderasi).toHaveBeenCalledWith(9, "restore", undefined);
  });
  it("kosong -> empty state", () => {
    render(<ModerasiTable jenis="menu" rows={[]} />);
    expect(screen.getByText("Tidak ada data")).toBeInTheDocument();
  });
});
