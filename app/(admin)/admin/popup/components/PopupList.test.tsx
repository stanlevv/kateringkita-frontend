// Test popupStatus (Tayang, Terjadwal, Berakhir, Nonaktif) dan PopupList: nonaktifkan pop-up, buat pop-up baru dengan
// unggah gambar, voucher, dan masa tayang WIB, serta support hanya melihat. Server action dan unggah diganti tiruan.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const savePopup = vi.fn();
const uploadPhoto = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/popup", () => ({ savePopup: (...args: unknown[]) => savePopup(...args) }));
vi.mock("@/app/actions/admin/banner", () => ({ requestAdminUpload: vi.fn() }));
vi.mock("@/lib/upload", () => ({ uploadPhoto: (...args: unknown[]) => uploadPhoto(...args) }));
import { Toaster } from "@/app/components/ui/Toast";
import type { Popup } from "@/types/popup";
import { PopupList, popupStatus } from "./PopupList";

const NOW = Date.now();
const isoInHours = (hours: number) => new Date(NOW + hours * 3600e3).toISOString();
const makePopup = (overrides: Partial<Popup>): Popup => ({
  id: 1,
  title: "Promo akhir pekan",
  image_url: "https://foto.test/p.webp",
  promo: null,
  starts_at: isoInHours(-1),
  ends_at: isoInHours(24),
  is_active: true,
  created_at: isoInHours(-2),
  ...overrides,
});

beforeEach(() => {
  refresh.mockReset();
  savePopup.mockReset().mockResolvedValue({ data: { id: 2 } });
  uploadPhoto.mockReset().mockResolvedValue({ data: { public_url: "https://foto.test/platform/popup/a.webp" } });
});

describe("popupStatus", () => {
  it("Tayang / Terjadwal / Berakhir / Nonaktif", () => {
    expect(popupStatus(makePopup({}), NOW).label).toBe("Tayang");
    expect(popupStatus(makePopup({ starts_at: isoInHours(2) }), NOW).label).toBe("Terjadwal");
    expect(popupStatus(makePopup({ ends_at: isoInHours(-1) }), NOW).label).toBe("Berakhir");
    expect(popupStatus(makePopup({ is_active: false }), NOW).label).toBe("Nonaktif");
  });
});

describe("PopupList", () => {
  it("kartu: status, voucher, Nonaktifkan → PATCH is_active false", async () => {
    render(
      <>
        <Toaster />
        <PopupList popups={[makePopup({ promo: { id: 7, code: "HEMAT3K" } })]} vouchers={[]} canEdit />
      </>,
    );
    const card = within(screen.getByRole("article"));
    expect(card.getByText("Tayang")).toBeInTheDocument();
    expect(card.getByText(/Voucher HEMAT3K/)).toBeInTheDocument();
    await userEvent.click(card.getByRole("button", { name: "Nonaktifkan" }));
    expect(savePopup).toHaveBeenCalledWith(1, { is_active: false });
    expect(refresh).toHaveBeenCalled();
  });

  it("buat pop-up: unggah (popup), voucher platform opsional, periode → savePopup(null, …)", async () => {
    render(
      <>
        <Toaster />
        <PopupList popups={[]} vouchers={[{ id: 7, code: "HEMAT3K", label: "Potongan Rp3.000" }]} canEdit />
      </>,
    );
    expect(screen.getByText("Belum ada pop-up")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Buat pop-up" }));
    await userEvent.type(screen.getByLabelText(/Judul/), "Promo akhir pekan");
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(["x"], "p.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(screen.getByRole("img", { name: "Pratinjau pop-up" })).toBeInTheDocument());
    expect(uploadPhoto).toHaveBeenCalledWith(expect.any(File), "popup", expect.anything());
    await userEvent.selectOptions(screen.getByLabelText(/Voucher/), "7");
    fireEvent.change(screen.getByLabelText(/Mulai/), { target: { value: "2026-11-20T07:00" } });
    fireEvent.change(screen.getByLabelText(/Selesai/), { target: { value: "2026-11-27T07:00" } });
    await userEvent.click(screen.getByRole("button", { name: "Simpan pop-up" }));
    await waitFor(() =>
      expect(savePopup).toHaveBeenCalledWith(null, {
        title: "Promo akhir pekan",
        image_url: "https://foto.test/platform/popup/a.webp",
        promo_id: 7,
        starts_at: "2026-11-20T00:00:00.000Z",
        ends_at: "2026-11-27T00:00:00.000Z",
        is_active: true,
      }),
    );
  });

  it("support hanya melihat", () => {
    render(<PopupList popups={[makePopup({})]} vouchers={[]} canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Buat pop-up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nonaktifkan" })).not.toBeInTheDocument();
  });
});
