import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import LupaSandiForm from "./LupaSandiForm";

const mintaKodeReset = vi.fn();
const resetKataSandi = vi.fn();
const push = vi.fn();
vi.mock("@/app/actions/auth", () => ({
  mintaKodeReset: (...a: unknown[]) => mintaKodeReset(...a),
  resetKataSandi: (...a: unknown[]) => resetKataSandi(...a),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const isi = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const klik = async (name: string) => act(async () => { fireEvent.click(screen.getByRole("button", { name })); });

beforeEach(() => { mintaKodeReset.mockReset(); resetKataSandi.mockReset(); push.mockReset(); });

describe("F11 lupa sandi", () => {
  it("email salah format -> galat, action tidak dipanggil", async () => {
    render(<LupaSandiForm />);
    isi(/^Email/, "bukan-email");
    await klik("Kirim kode");
    expect(screen.getAllByText("Format email tidak valid.").length).toBeGreaterThan(0);
    expect(mintaKodeReset).not.toHaveBeenCalled();
  });

  it("email -> kode + sandi baru -> /login?reset=1", async () => {
    mintaKodeReset.mockResolvedValue({ ok: true });
    resetKataSandi.mockResolvedValue({ ok: true });
    render(<LupaSandiForm />);
    isi(/^Email/, " siti@mail.com ");
    await klik("Kirim kode");
    expect(mintaKodeReset).toHaveBeenCalledWith("siti@mail.com");
    isi(/Kode verifikasi/, "123456");
    isi(/^Kata sandi baru/, "sandiBaru123");
    isi(/Ulangi kata sandi baru/, "sandiLain123");
    await klik("Simpan kata sandi");
    expect(screen.getAllByText("Konfirmasi kata sandi tidak sama.").length).toBeGreaterThan(0);
    isi(/Ulangi kata sandi baru/, "sandiBaru123");
    await klik("Simpan kata sandi");
    expect(resetKataSandi).toHaveBeenCalledWith({ email: "siti@mail.com", code: "123456", password: "sandiBaru123" });
    expect(push).toHaveBeenCalledWith("/login?reset=1");
  });

  it("kode salah dari API -> galat di field kode, tetap di langkah kode", async () => {
    mintaKodeReset.mockResolvedValue({ ok: true });
    resetKataSandi.mockResolvedValue({ error: "Data tidak valid.", code: "VALIDATION_ERROR", fields: { code: ["Kode salah atau sudah kedaluwarsa."] } });
    render(<LupaSandiForm />);
    isi(/^Email/, "siti@mail.com");
    await klik("Kirim kode");
    isi(/Kode verifikasi/, "000000");
    isi(/^Kata sandi baru/, "sandiBaru123");
    isi(/Ulangi kata sandi baru/, "sandiBaru123");
    await klik("Simpan kata sandi");
    expect(screen.getAllByText("Kode salah atau sudah kedaluwarsa.").length).toBeGreaterThan(0);
    expect(push).not.toHaveBeenCalled();
  });
});
