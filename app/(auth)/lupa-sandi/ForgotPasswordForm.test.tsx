// Test formulir lupa kata sandi (ForgotPasswordForm): validasi email, alur email -> kode + sandi baru -> /login?reset=1,
// dan galat kode dari server. Server action dan router dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ForgotPasswordForm from "./ForgotPasswordForm";

const requestResetCode = vi.fn();
const resetPassword = vi.fn();
const push = vi.fn();
vi.mock("@/app/actions/auth", () => ({
  requestResetCode: (...args: unknown[]) => requestResetCode(...args),
  resetPassword: (...args: unknown[]) => resetPassword(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = async (name: string) =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });

beforeEach(() => {
  requestResetCode.mockReset();
  resetPassword.mockReset();
  push.mockReset();
});

describe("F11 lupa sandi", () => {
  it("email salah format -> galat, action tidak dipanggil", async () => {
    render(<ForgotPasswordForm />);
    fill(/^Email/, "bukan-email");
    await click("Kirim kode");
    expect(screen.getAllByText("Format email tidak valid.").length).toBeGreaterThan(0);
    expect(requestResetCode).not.toHaveBeenCalled();
  });

  it("email -> kode + sandi baru -> /login?reset=1", async () => {
    requestResetCode.mockResolvedValue({ ok: true });
    resetPassword.mockResolvedValue({ ok: true });
    render(<ForgotPasswordForm />);
    fill(/^Email/, " siti@mail.com ");
    await click("Kirim kode");
    expect(requestResetCode).toHaveBeenCalledWith("siti@mail.com");
    fill(/Kode verifikasi/, "123456");
    fill(/^Kata sandi baru/, "sandiBaru123");
    fill(/Ulangi kata sandi baru/, "sandiLain123");
    await click("Simpan kata sandi");
    expect(screen.getAllByText("Konfirmasi kata sandi tidak sama.").length).toBeGreaterThan(0);
    fill(/Ulangi kata sandi baru/, "sandiBaru123");
    await click("Simpan kata sandi");
    expect(resetPassword).toHaveBeenCalledWith({ email: "siti@mail.com", code: "123456", password: "sandiBaru123" });
    expect(push).toHaveBeenCalledWith("/login?reset=1");
  });

  it("kode salah dari API -> galat di field kode, tetap di langkah kode", async () => {
    requestResetCode.mockResolvedValue({ ok: true });
    resetPassword.mockResolvedValue({
      error: "Data tidak valid.",
      code: "VALIDATION_ERROR",
      fields: { code: ["Kode salah atau sudah kedaluwarsa."] },
    });
    render(<ForgotPasswordForm />);
    fill(/^Email/, "siti@mail.com");
    await click("Kirim kode");
    fill(/Kode verifikasi/, "000000");
    fill(/^Kata sandi baru/, "sandiBaru123");
    fill(/Ulangi kata sandi baru/, "sandiBaru123");
    await click("Simpan kata sandi");
    expect(screen.getAllByText("Kode salah atau sudah kedaluwarsa.").length).toBeGreaterThan(0);
    expect(push).not.toHaveBeenCalled();
  });
});
