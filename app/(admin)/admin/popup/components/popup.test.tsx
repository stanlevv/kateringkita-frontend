import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const simpanPopup = vi.fn();
const unggahFoto = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/admin/popup", () => ({ simpanPopup: (...a: unknown[]) => simpanPopup(...a) }));
vi.mock("@/app/actions/admin/banner", () => ({ mintaUnggahAdmin: vi.fn() }));
vi.mock("@/lib/unggah", () => ({ unggahFoto: (...a: unknown[]) => unggahFoto(...a) }));
import { Toaster } from "@/app/components/ui/Toast";
import type { Popup } from "@/types/popup";
import { DaftarPopup, statusPopup } from "./DaftarPopup";

const NOW = Date.now();
const iso = (h: number) => new Date(NOW + h * 3600e3).toISOString();
const p = (o: Partial<Popup>): Popup => ({
  id: 1, title: "Promo akhir pekan", image_url: "https://foto.test/p.webp", promo: null, starts_at: iso(-1), ends_at: iso(24), is_active: true,
  created_at: iso(-2), ...o,
});

beforeEach(() => {
  refresh.mockReset();
  simpanPopup.mockReset().mockResolvedValue({ data: { id: 2 } });
  unggahFoto.mockReset().mockResolvedValue({ data: { public_url: "https://foto.test/platform/popup/a.webp" } });
});

describe("statusPopup", () => {
  it("Tayang / Terjadwal / Berakhir / Nonaktif", () => {
    expect(statusPopup(p({}), NOW).label).toBe("Tayang");
    expect(statusPopup(p({ starts_at: iso(2) }), NOW).label).toBe("Terjadwal");
    expect(statusPopup(p({ ends_at: iso(-1) }), NOW).label).toBe("Berakhir");
    expect(statusPopup(p({ is_active: false }), NOW).label).toBe("Nonaktif");
  });
});

describe("DaftarPopup", () => {
  it("kartu: status, voucher, Nonaktifkan → PATCH is_active false", async () => {
    render(<><Toaster /><DaftarPopup popups={[p({ promo: { id: 7, code: "HEMAT3K" } })]} vouchers={[]} bolehUbah /></>);
    const k = within(screen.getByRole("article"));
    expect(k.getByText("Tayang")).toBeInTheDocument();
    expect(k.getByText(/Voucher HEMAT3K/)).toBeInTheDocument();
    await userEvent.click(k.getByRole("button", { name: "Nonaktifkan" }));
    expect(simpanPopup).toHaveBeenCalledWith(1, { is_active: false });
    expect(refresh).toHaveBeenCalled();
  });

  it("buat pop-up: unggah (popup), voucher platform opsional, periode → simpanPopup(null, …)", async () => {
    render(<><Toaster /><DaftarPopup popups={[]} vouchers={[{ id: 7, code: "HEMAT3K", label: "Potongan Rp3.000" }]} bolehUbah /></>);
    expect(screen.getByText("Belum ada pop-up")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Buat pop-up" }));
    await userEvent.type(screen.getByLabelText(/Judul/), "Promo akhir pekan");
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [new File(["x"], "p.png", { type: "image/png" })] } });
    await waitFor(() => expect(screen.getByRole("img", { name: "Pratinjau pop-up" })).toBeInTheDocument());
    expect(unggahFoto).toHaveBeenCalledWith(expect.any(File), "popup", expect.anything());
    await userEvent.selectOptions(screen.getByLabelText(/Voucher/), "7");
    fireEvent.change(screen.getByLabelText(/Mulai/), { target: { value: "2026-11-20T07:00" } });
    fireEvent.change(screen.getByLabelText(/Selesai/), { target: { value: "2026-11-27T07:00" } });
    await userEvent.click(screen.getByRole("button", { name: "Simpan pop-up" }));
    await waitFor(() => expect(simpanPopup).toHaveBeenCalledWith(null, {
      title: "Promo akhir pekan", image_url: "https://foto.test/platform/popup/a.webp", promo_id: 7,
      starts_at: "2026-11-20T00:00:00.000Z", ends_at: "2026-11-27T00:00:00.000Z", is_active: true,
    }));
  });

  it("support hanya melihat", () => {
    render(<DaftarPopup popups={[p({})]} vouchers={[]} bolehUbah={false} />);
    expect(screen.queryByRole("button", { name: "Buat pop-up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nonaktifkan" })).not.toBeInTheDocument();
  });
});
