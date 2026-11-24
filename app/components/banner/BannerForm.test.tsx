// Test BannerForm: mode penjual (tujuan halaman toko atau voucher, isi kiriman), galat klien dan server, serta mode
// admin (tanpa tujuan, urutan tampil, unggah lewat aksi admin). uploadPhoto dipalsukan (vi.mock).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadPhoto = vi.fn();
vi.mock("@/lib/upload", () => ({ uploadPhoto: (...args: unknown[]) => uploadPhoto(...args) }));
import { BannerForm } from "./BannerForm";

const saveAction = vi.fn();
const onSaved = vi.fn();
const VOUCHER = [{ id: 5, code: "HEMAT10", label: "Diskon 10%" }];

beforeEach(() => {
  saveAction.mockReset();
  onSaved.mockReset();
  uploadPhoto.mockReset().mockResolvedValue({ data: { public_url: "https://foto.test/merchants/1/banner/a.webp" } });
});

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText(/Judul/), "Diskon pembukaan");
  const file = new File(["x"], "b.png", { type: "image/png" });
  expect(screen.getByLabelText(/Gambar banner/)).toBeInTheDocument();
  fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole("img", { name: "Pratinjau banner" })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/Mulai/), { target: { value: "2026-11-20T07:00" } });
  fireEvent.change(screen.getByLabelText(/Selesai/), { target: { value: "2026-11-27T07:00" } });
};

describe("BannerForm", () => {
  it("penjual: tujuan halaman toko / voucher toko; kirim payload lengkap", async () => {
    saveAction.mockResolvedValue({ data: { id: 9 } });
    render(
      <BannerForm mode="merchant" vouchers={VOUCHER} saveAction={saveAction} onSaved={onSaved} onClose={() => {}} />,
    );
    await fillForm();
    expect(uploadPhoto).toHaveBeenCalledWith(expect.any(File), "banner", undefined);
    await userEvent.selectOptions(screen.getByLabelText(/Tujuan/), "promo");
    await userEvent.selectOptions(screen.getByLabelText(/Voucher/), "5");
    await userEvent.click(screen.getByRole("button", { name: "Ajukan banner" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(saveAction).toHaveBeenCalledWith(null, {
      title: "Diskon pembukaan",
      image_url: "https://foto.test/merchants/1/banner/a.webp",
      target: "promo",
      promo_id: 5,
      starts_at: "2026-11-20T00:00:00.000Z",
      ends_at: "2026-11-27T00:00:00.000Z",
    });
  });

  it("galat klien & galat server tampil di kolomnya; tanpa kirim saat klien gagal", async () => {
    render(
      <BannerForm mode="merchant" vouchers={VOUCHER} saveAction={saveAction} onSaved={onSaved} onClose={() => {}} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ajukan banner" }));
    expect(screen.getAllByText("Judul 3–80 karakter.").length).toBeGreaterThan(0);
    expect(saveAction).not.toHaveBeenCalled();
    saveAction.mockResolvedValue({ error: { code: "CONFLICT", message: "Toko ini sudah punya banner aktif." } });
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Ajukan banner" }));
    expect(await screen.findByText("Toko ini sudah punya banner aktif.")).toBeInTheDocument();
  });

  it("admin: tujuan voucher / tanpa tujuan, urutan; unggah lewat aksi admin", async () => {
    const adminUploadRequest = vi.fn();
    saveAction.mockResolvedValue({ data: { id: 9 } });
    render(
      <BannerForm
        mode="admin"
        vouchers={VOUCHER}
        saveAction={saveAction}
        onSaved={onSaved}
        onClose={() => {}}
        requestUpload={adminUploadRequest}
      />,
    );
    expect(
      Array.from((screen.getByLabelText(/Tujuan/) as HTMLSelectElement).options).map((option) => option.value),
    ).toEqual(["none", "promo"]);
    await fillForm();
    expect(uploadPhoto).toHaveBeenCalledWith(expect.any(File), "banner", adminUploadRequest);
    fireEvent.change(screen.getByLabelText(/Urutan/), { target: { value: "2" } });
    await userEvent.click(screen.getByRole("button", { name: "Simpan banner" }));
    await waitFor(() =>
      expect(saveAction).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ target: "none", promo_id: null, sort_order: 2 }),
      ),
    );
  });
});
