// Test EmailVerification: status email, verifikasi email sekarang, ganti email, dan kode salah.
// Server action dan router dipalsukan (vi.mock), jadi test berjalan tanpa backend.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/app/components/ui/Toast";
import { EmailVerification } from "./EmailVerification";

const sendEmailCode = vi.fn();
const verifyEmailCode = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/account", () => ({
  sendEmailCode: (...args: unknown[]) => sendEmailCode(...args),
  verifyEmailCode: (...args: unknown[]) => verifyEmailCode(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  sendEmailCode.mockReset();
  verifyEmailCode.mockReset();
  refresh.mockReset();
});
const renderSection = (email = "d@x.id", verified = false) =>
  render(
    <>
      <EmailVerification email={email} verified={verified} />
      <Toaster />
    </>,
  );
const wrongCode = {
  error: { code: "VALIDATION_ERROR", message: "x", fields: { code: ["Kode salah atau sudah kedaluwarsa."] } },
};

describe("EmailVerification", () => {
  it("terverifikasi: lencana hijau, tanpa tombol kirim kode", () => {
    renderSection("d@x.id", true);
    expect(screen.getByText("Terverifikasi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kirim kode verifikasi" })).not.toBeInTheDocument();
  });

  it("verifikasi email sekarang: kirim kode, kode salah tampil di field, kode benar memuat ulang", async () => {
    sendEmailCode.mockResolvedValue({ data: { email: "d@x.id" } });
    verifyEmailCode.mockResolvedValueOnce(wrongCode).mockResolvedValueOnce({ data: { user: {}, merchant: null } });
    renderSection();
    expect(screen.getByText("Belum diverifikasi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Kirim kode verifikasi" }));
    expect(sendEmailCode).toHaveBeenCalledWith(null);
    const codeField = await screen.findByLabelText(/Kode verifikasi/);
    await userEvent.type(codeField, "12a3456");
    expect(codeField).toHaveValue("123456");
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    expect(await screen.findByText("Kode salah atau sudah kedaluwarsa.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    expect(await screen.findByText("Email terverifikasi")).toBeInTheDocument();
    expect(verifyEmailCode).toHaveBeenLastCalledWith("123456");
    expect(refresh).toHaveBeenCalled();
  });

  it("ganti email: kirim email baru dan sandi; galat email dipakai tampil di field", async () => {
    sendEmailCode
      .mockResolvedValueOnce({
        error: { code: "CONFLICT", message: "x", fields: { email: ["Email sudah dipakai akun lain."] } },
      })
      .mockResolvedValueOnce({ data: { email: "baru@x.id" } });
    renderSection("d@x.id", true);
    await userEvent.click(screen.getByRole("button", { name: "Ganti email" }));
    await userEvent.type(screen.getByLabelText(/Email baru/), "baru@x.id");
    await userEvent.type(screen.getByLabelText(/Kata sandi saat ini/), "rahasia123");
    await userEvent.click(screen.getByRole("button", { name: "Kirim kode ke email baru" }));
    expect(sendEmailCode).toHaveBeenCalledWith({ email: "baru@x.id", current_password: "rahasia123" });
    expect(await screen.findByText("Email sudah dipakai akun lain.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Kirim kode ke email baru" }));
    expect(await screen.findByText(/6 angka yang dikirim ke baru@x\.id/)).toBeInTheDocument();
  });

  it("akun tanpa email: tombol Tambah email", () => {
    renderSection("", false);
    expect(screen.getByText("Belum ada email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tambah email" })).toBeInTheDocument();
  });
});
