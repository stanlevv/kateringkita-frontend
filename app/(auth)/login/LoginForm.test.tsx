// Test formulir masuk (LoginForm): validasi isian, field next, pesan per kode galat (sandi salah, 429 dengan
// hitung mundur, jaringan, akun pembeli), banner keterangan dari URL, dan tombol lihat kata sandi.
// Server action login dipalsukan (vi.mock) sehingga tidak ada panggilan ke backend.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import LoginForm from "./LoginForm";

const login = vi.fn();
vi.mock("@/app/actions/auth", () => ({ login: (...args: unknown[]) => login(...args) }));

async function submitForm(identifier = "081234567890", password = "rahasia123") {
  fireEvent.change(screen.getByLabelText(/Email atau nomor WA/), { target: { value: identifier } });
  fireEvent.change(screen.getByLabelText(/^Kata sandi/), { target: { value: password } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
  });
}

beforeEach(() => login.mockReset());
afterEach(() => vi.useRealTimers());

describe("login", () => {
  it("field kosong -> error per field, action tidak dipanggil", async () => {
    render(<LoginForm />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    });
    expect(screen.getAllByText("Email atau nomor WA wajib diisi.").length).toBeGreaterThan(0);
    expect(login).not.toHaveBeenCalled();
  });

  it("next dikirim sebagai field tersembunyi", async () => {
    login.mockResolvedValue(undefined);
    render(<LoginForm next="/menu?q=a" />);
    await submitForm();
    expect((login.mock.calls[0][1] as FormData).get("next")).toBe("/menu?q=a");
  });

  it("kredensial salah -> pesan umum, kata sandi kosong + fokus", async () => {
    login.mockResolvedValue({ code: "UNAUTHENTICATED", error: "x" });
    render(<LoginForm />);
    await submitForm();
    expect(screen.getByText("Email/WA atau kata sandi salah.")).toBeInTheDocument();
    const passwordInput = screen.getByLabelText(/^Kata sandi/) as HTMLInputElement;
    expect(passwordInput.value).toBe("");
    expect(passwordInput).toHaveFocus();
  });

  it("RATE_LIMITED -> tombol nonaktif dengan hitung mundur 60 dtk", async () => {
    vi.useFakeTimers();
    login.mockResolvedValue({ code: "RATE_LIMITED", error: "x" });
    render(<LoginForm />);
    await submitForm();
    const button = screen.getByRole("button", { name: "Coba lagi dalam 60 dtk" });
    expect(button).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("button", { name: "Coba lagi dalam 59 dtk" })).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(screen.getByRole("button", { name: "Masuk" })).toBeEnabled();
    expect(screen.queryByText(/Terlalu banyak percobaan/)).not.toBeInTheDocument();
  });

  it("NETWORK -> pesan server tidak terjangkau, isian tetap", async () => {
    login.mockResolvedValue({ code: "NETWORK", error: "x" });
    render(<LoginForm />);
    await submitForm();
    expect(screen.getByText("Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.")).toBeInTheDocument();
    expect((screen.getByLabelText(/Email atau nomor WA/) as HTMLInputElement).value).toBe("081234567890");
  });

  it("NOT_MERCHANT -> pesan akun pembeli", async () => {
    login.mockResolvedValue({ code: "NOT_MERCHANT", error: "x" });
    render(<LoginForm />);
    await submitForm();
    expect(screen.getByText("Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.")).toBeInTheDocument();
  });

  it("banner konteks (lanjut, sesi habis, akun pembeli, baru daftar)", () => {
    const { rerender } = render(<LoginForm next="/menu" />);
    expect(screen.getByText("Masuk untuk melanjutkan")).toBeInTheDocument();
    rerender(<LoginForm reason="sesi-habis" />);
    expect(screen.getByText("Sesi berakhir, silakan masuk lagi")).toBeInTheDocument();
    rerender(<LoginForm reason="bukan-penjual" />);
    expect(screen.getByText("Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.")).toBeInTheDocument();
    rerender(<LoginForm registered />);
    expect(screen.getByText("Akun berhasil dibuat. Silakan masuk.")).toBeInTheDocument();
  });

  it("tampilkan/sembunyikan kata sandi", () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText(/^Kata sandi/);
    const button = screen.getByRole("button", { name: "Tampilkan kata sandi" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Sembunyikan kata sandi" })).toHaveAttribute("aria-pressed", "true");
  });
});
