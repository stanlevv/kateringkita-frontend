// Test popupStatus (Tayang, Terjadwal, Berakhir, Nonaktif) dan PopupList: nonaktifkan pop-up, buat pop-up baru dengan
// unggah gambar, voucher, dan masa tayang WIB, ubah pop-up, arsip dengan konfirmasi, pulihkan di tampilan Arsip, pesan
// 409 apa adanya, serta support hanya melihat. Server action dan unggah diganti tiruan.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const savePopup = vi.fn();
const setPopupArchived = vi.fn();
const uploadPhoto = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/popup", () => ({
  savePopup: (...args: unknown[]) => savePopup(...args),
  setPopupArchived: (...args: unknown[]) => setPopupArchived(...args),
}));
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
  setPopupArchived.mockReset().mockResolvedValue({ data: { id: 1 } });
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
    expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Arsipkan" })).not.toBeInTheDocument();
  });

  it("ubah: dialog terisi (voucher lama tetap jadi pilihan) → savePopup(id, …)", async () => {
    render(
      <>
        <Toaster />
        <PopupList
          popups={[
            makePopup({
              promo: { id: 9, code: "LAMA9K" },
              starts_at: "2026-11-20T00:00:00.000Z",
              ends_at: "2026-11-27T00:00:00.000Z",
            }),
          ]}
          vouchers={[{ id: 7, code: "HEMAT3K", label: "Potongan Rp3.000" }]}
          canEdit
        />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ubah" }));
    expect(screen.getByRole("dialog", { name: "Ubah pop-up" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Judul/)).toHaveValue("Promo akhir pekan");
    expect(screen.getByLabelText(/Voucher/)).toHaveValue("9");
    expect(screen.getByRole("img", { name: "Pratinjau pop-up" })).toHaveAttribute("src", "https://foto.test/p.webp");
    await userEvent.clear(screen.getByLabelText(/Judul/));
    await userEvent.type(screen.getByLabelText(/Judul/), "Promo baru");
    await userEvent.click(screen.getByRole("button", { name: "Simpan pop-up" }));
    await waitFor(() =>
      expect(savePopup).toHaveBeenCalledWith(1, {
        title: "Promo baru",
        image_url: "https://foto.test/p.webp",
        promo_id: 9,
        starts_at: "2026-11-20T00:00:00.000Z",
        ends_at: "2026-11-27T00:00:00.000Z",
        is_active: true,
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("arsipkan lewat konfirmasi → setPopupArchived(id, true)", async () => {
    render(
      <>
        <Toaster />
        <PopupList popups={[makePopup({})]} vouchers={[]} canEdit />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Arsipkan" }));
    expect(setPopupArchived).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Ya, arsipkan" }));
    await waitFor(() => expect(setPopupArchived).toHaveBeenCalledWith(1, true));
    expect(await screen.findByText("Pop-up diarsipkan.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("tampilan Arsip: hanya Pulihkan; pesan 409 tampil apa adanya", async () => {
    const message = "Pulihkan dulu promo yang dipakai konten ini.";
    setPopupArchived.mockResolvedValue({ error: { code: "PROMO_ARCHIVED", message } });
    render(
      <>
        <Toaster />
        <PopupList popups={[makePopup({})]} vouchers={[]} canEdit archived />
      </>,
    );
    for (const name of ["Buat pop-up", "Ubah", "Nonaktifkan", "Arsipkan"])
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pulihkan" }));
    expect(setPopupArchived).toHaveBeenCalledWith(1, false);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("tampilan Arsip: kosong dan support tanpa Pulihkan", () => {
    const { rerender } = render(<PopupList popups={[]} vouchers={[]} canEdit archived />);
    expect(screen.getByText("Belum ada pop-up yang diarsipkan")).toBeInTheDocument();
    rerender(<PopupList popups={[makePopup({})]} vouchers={[]} canEdit={false} archived />);
    expect(screen.queryByRole("button", { name: "Pulihkan" })).not.toBeInTheDocument();
  });

  it("Pulihkan nonaktif selama permintaan berjalan (cegah klik ganda)", async () => {
    let finish: (value: unknown) => void = () => {};
    setPopupArchived.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<PopupList popups={[makePopup({})]} vouchers={[]} canEdit archived />);
    await userEvent.click(screen.getByRole("button", { name: "Pulihkan" }));
    expect(screen.getByRole("button", { name: "Pulihkan" })).toBeDisabled();
    finish({ data: { id: 1 } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Pulihkan" })).toBeEnabled());
    expect(setPopupArchived).toHaveBeenCalledTimes(1);
  });
});
