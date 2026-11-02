import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const savePromo = vi.fn();
vi.mock("@/app/actions/promos", () => ({ savePromo: (...a: unknown[]) => savePromo(...a) }));
import { promos } from "@/lib/fixtures/promos";
import { PromoForm } from "./PromoForm";

const onSaved = vi.fn();
const onClose = vi.fn();
const tampil = (promo?: Parameters<typeof PromoForm>[0]["promo"]) => render(<PromoForm promo={promo} onSaved={onSaved} onClose={onClose} />);
const ketik = async (label: string | RegExp, teks: string) => {
  const el = screen.getByLabelText(label) as HTMLInputElement;
  if (el.type === "datetime-local") return void fireEvent.change(el, { target: { value: teks } });
  await userEvent.clear(el);
  if (teks) await userEvent.type(el, teks);
};
const simpan = () => userEvent.click(screen.getByRole("button", { name: "Simpan promo" }));
const isiValid = async () => {
  await ketik(/Kode promo/, "ramadan");
  await ketik(/^Nilai/, "10");
};

beforeEach(() => { savePromo.mockReset(); onSaved.mockReset(); onClose.mockReset(); });

describe("PromoForm (PR-N2, PR-E1, PR-E2)", () => {
  it("kode dipaksa huruf besar", async () => {
    tampil();
    await ketik(/Kode promo/, "ramadan1");
    expect(screen.getByLabelText(/Kode promo/)).toHaveValue("RAMADAN1");
  });

  it("PR-E2 nilai 0, persen > 100, selesai <= mulai -> error per field + ringkasan fokus", async () => {
    tampil();
    await ketik(/Kode promo/, "AB");
    await ketik(/^Nilai/, "0");
    await ketik(/Selesai/, "2020-01-01T00:00");
    await simpan();
    expect(screen.getByRole("alert", { name: "" })).toHaveFocus();
    expect(screen.getAllByText("Kode 3–30 huruf besar atau angka.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nilai minimal 1.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Waktu selesai harus setelah waktu mulai.").length).toBeGreaterThan(0);
    expect(savePromo).not.toHaveBeenCalled();
    await ketik(/^Nilai/, "101");
    expect(screen.getAllByText("Persen maksimal 100.").length).toBeGreaterThan(0);
  });

  it("jenis gratis biaya layanan menyembunyikan nilai; potongan Rupiah menyembunyikan maks potongan", async () => {
    tampil();
    expect(screen.getByLabelText(/Maks potongan/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/Jenis promo/), "fixed");
    expect(screen.queryByLabelText(/Maks potongan/)).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText(/Jenis promo/), "free_service_fee");
    expect(screen.queryByLabelText(/^Nilai/)).toBeNull();
  });

  it("submit valid mengirim kode kapital, waktu ISO UTC, kuota kosong = null", async () => {
    savePromo.mockResolvedValue({ data: { ...promos()[0], id: 9, code: "RAMADAN" } });
    tampil();
    await isiValid();
    await ketik(/Mulai/, "2026-11-01T07:00");
    await ketik(/Selesai/, "2026-12-01T07:00");
    await simpan();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(savePromo).toHaveBeenCalledWith(null, expect.objectContaining({ code: "RAMADAN", type: "percent", value: 10, quota: null, starts_at: "2026-11-01T00:00:00.000Z", ends_at: "2026-12-01T00:00:00.000Z" }));
  });

  it("PR-E1 respons 409 -> error di field kode, fokus ke ringkasan, form tetap terisi", async () => {
    savePromo.mockResolvedValue({ error: { code: "CONFLICT", message: "Kode sudah dipakai.", fields: { code: ["Kode sudah dipakai."] } } });
    tampil();
    await isiValid();
    await simpan();
    await waitFor(() => expect(screen.getAllByText("Kode sudah dipakai.").length).toBeGreaterThan(0));
    expect(screen.getByLabelText(/Kode promo/)).toHaveValue("RAMADAN");
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("alert", { name: "" })).toHaveFocus();
  });

  it("mode ubah: terisi dari promo, waktu WIB", () => {
    const p = promos()[0];
    tampil(p);
    expect(screen.getByLabelText(/Kode promo/)).toHaveValue(p.code);
    expect(screen.getByLabelText(/Mulai/)).toHaveValue(new Date(Date.parse(p.starts_at) + 7 * 3600e3).toISOString().slice(0, 16));
  });
});
