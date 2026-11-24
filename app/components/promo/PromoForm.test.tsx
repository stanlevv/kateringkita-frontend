// Test PromoForm: kode huruf besar, galat per isian dan ringkasan, isian per jenis promo, opsi khusus admin, sakelar
// tampil di halaman toko, isi kiriman, galat 409 dari server, dan mode ubah. savePromo dipalsukan (vi.mock).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const savePromo = vi.fn();
vi.mock("@/app/actions/promos", () => ({ savePromo: (...args: unknown[]) => savePromo(...args) }));
import { promos } from "@/lib/fixtures/promos";
import { PromoForm } from "./PromoForm";

const onSaved = vi.fn();
const onClose = vi.fn();
const renderForm = (promo?: Parameters<typeof PromoForm>[0]["promo"]) =>
  render(<PromoForm promo={promo} onSaved={onSaved} onClose={onClose} />);
const typeInto = async (label: string | RegExp, text: string) => {
  const field = screen.getByLabelText(label) as HTMLInputElement;
  if (field.type === "datetime-local") return void fireEvent.change(field, { target: { value: text } });
  await userEvent.clear(field);
  if (text) await userEvent.type(field, text);
};
const clickSave = () => userEvent.click(screen.getByRole("button", { name: "Simpan promo" }));
const fillValid = async () => {
  await typeInto(/Kode promo/, "ramadan");
  await typeInto(/^Nilai/, "10");
};

beforeEach(() => {
  savePromo.mockReset();
  onSaved.mockReset();
  onClose.mockReset();
});

describe("PromoForm", () => {
  it("kode dipaksa huruf besar", async () => {
    renderForm();
    await typeInto(/Kode promo/, "ramadan1");
    expect(screen.getByLabelText(/Kode promo/)).toHaveValue("RAMADAN1");
  });

  it("nilai 0, persen > 100, selesai <= mulai -> error per field + ringkasan fokus", async () => {
    renderForm();
    await typeInto(/Kode promo/, "AB");
    await typeInto(/^Nilai/, "0");
    await typeInto(/Selesai/, "2020-01-01T00:00");
    await clickSave();
    expect(screen.getByRole("alert", { name: "" })).toHaveFocus();
    expect(screen.getAllByText("Kode 3–30 huruf besar atau angka.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nilai minimal 1.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Waktu selesai harus setelah waktu mulai.").length).toBeGreaterThan(0);
    expect(savePromo).not.toHaveBeenCalled();
    await typeInto(/^Nilai/, "101");
    expect(screen.getAllByText("Persen maksimal 100.").length).toBeGreaterThan(0);
  });

  it("jenis gratis biaya layanan menyembunyikan nilai; potongan Rupiah menyembunyikan maks potongan", async () => {
    render(<PromoForm admin onSaved={onSaved} onClose={onClose} />);
    expect(screen.getByLabelText(/Maks potongan/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/Jenis promo/), "fixed");
    expect(screen.queryByLabelText(/Maks potongan/)).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText(/Jenis promo/), "free_service_fee");
    expect(screen.queryByLabelText(/^Nilai/)).toBeNull();
  });

  it("penjual tidak punya opsi gratis biaya layanan; admin tetap punya; promo toko lama jenis itu tetap bisa diubah", () => {
    const optionValues = () =>
      Array.from((screen.getByLabelText(/Jenis promo/) as HTMLSelectElement).options).map((option) => option.value);
    const { unmount } = renderForm();
    expect(optionValues()).toEqual(["percent", "fixed"]);
    unmount();
    const adminView = render(<PromoForm admin onSaved={onSaved} onClose={onClose} />);
    expect(optionValues()).toEqual(["percent", "fixed", "free_service_fee"]);
    adminView.unmount();
    renderForm({ ...promos()[0], type: "free_service_fee", value: 0 });
    expect(optionValues()).toContain("free_service_fee");
  });

  it("sakelar tampil di halaman toko: bawaan menyala, dimatikan → is_public false terkirim", async () => {
    savePromo.mockResolvedValue({ data: { ...promos()[0], id: 9, code: "RAMADAN", is_public: false } });
    renderForm();
    const publicSwitch = screen.getByRole("switch", { name: "Tampilkan di halaman toko" });
    expect(publicSwitch).toHaveAttribute("aria-checked", "true");
    await userEvent.click(publicSwitch);
    await fillValid();
    await clickSave();
    await waitFor(() => expect(savePromo).toHaveBeenCalledWith(null, expect.objectContaining({ is_public: false })));
  });

  it("admin: sakelar bernama 'Tampilkan di daftar voucher'", () => {
    render(<PromoForm admin onSaved={onSaved} onClose={onClose} />);
    expect(screen.getByRole("switch", { name: "Tampilkan di daftar voucher" })).toHaveAttribute("aria-checked", "true");
  });

  it("submit valid mengirim kode kapital, waktu ISO UTC, kuota kosong = null", async () => {
    savePromo.mockResolvedValue({ data: { ...promos()[0], id: 9, code: "RAMADAN" } });
    renderForm();
    await fillValid();
    await typeInto(/Mulai/, "2026-11-01T07:00");
    await typeInto(/Selesai/, "2026-12-01T07:00");
    await clickSave();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(savePromo).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        code: "RAMADAN",
        type: "percent",
        value: 10,
        quota: null,
        starts_at: "2026-11-01T00:00:00.000Z",
        ends_at: "2026-12-01T00:00:00.000Z",
      }),
    );
  });

  it("respons 409 -> error di field kode, fokus ke ringkasan, form tetap terisi", async () => {
    savePromo.mockResolvedValue({
      error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } },
    });
    renderForm();
    await fillValid();
    await clickSave();
    await waitFor(() => expect(screen.getAllByText("Kode sudah dipakai.").length).toBeGreaterThan(0));
    expect(screen.getByLabelText(/Kode promo/)).toHaveValue("RAMADAN");
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("alert", { name: "" })).toHaveFocus();
  });

  it("mode ubah: terisi dari promo, waktu WIB", () => {
    const promo = promos()[0];
    renderForm(promo);
    expect(screen.getByLabelText(/Kode promo/)).toHaveValue(promo.code);
    expect(screen.getByLabelText(/Mulai/)).toHaveValue(
      new Date(Date.parse(promo.starts_at) + 7 * 3600e3).toISOString().slice(0, 16),
    );
  });
});
