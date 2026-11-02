import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import LoginForm from "./LoginForm";

const login = vi.fn();
vi.mock("@/app/actions/auth", () => ({ login: (...a: unknown[]) => login(...a) }));

async function kirim(identifier = "081234567890", password = "rahasia123") {
  fireEvent.change(screen.getByLabelText(/Email atau nomor WA/), { target: { value: identifier } });
  fireEvent.change(screen.getByLabelText(/^Kata sandi/), { target: { value: password } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Masuk" })); });
}

beforeEach(() => login.mockReset());
afterEach(() => vi.useRealTimers());

describe("login", () => {
  it("LG-E1 field kosong -> error per field, action tidak dipanggil", async () => {
    render(<LoginForm />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Masuk" })); });
    expect(screen.getAllByText("Email atau nomor WA wajib diisi.").length).toBeGreaterThan(0);
    expect(login).not.toHaveBeenCalled();
  });

  it("LG-N1 next dikirim sebagai field tersembunyi", async () => {
    login.mockResolvedValue(undefined);
    render(<LoginForm next="/menu?q=a" />);
    await kirim();
    expect((login.mock.calls[0][1] as FormData).get("next")).toBe("/menu?q=a");
  });

  it("LG-E2 kredensial salah -> pesan umum, kata sandi kosong + fokus", async () => {
    login.mockResolvedValue({ code: "UNAUTHENTICATED", error: "x" });
    render(<LoginForm />);
    await kirim();
    expect(screen.getByText("Email/WA atau kata sandi salah.")).toBeInTheDocument();
    const pw = screen.getByLabelText(/^Kata sandi/) as HTMLInputElement;
    expect(pw.value).toBe("");
    expect(pw).toHaveFocus();
  });

  it("LG-E3 RATE_LIMITED -> tombol nonaktif dengan hitung mundur 60 dtk", async () => {
    vi.useFakeTimers();
    login.mockResolvedValue({ code: "RATE_LIMITED", error: "x" });
    render(<LoginForm />);
    await kirim();
    const tombol = screen.getByRole("button", { name: "Coba lagi dalam 60 dtk" });
    expect(tombol).toBeDisabled();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole("button", { name: "Coba lagi dalam 59 dtk" })).toBeDisabled();
    act(() => { vi.advanceTimersByTime(59_000); });
    expect(screen.getByRole("button", { name: "Masuk" })).toBeEnabled();
    expect(screen.queryByText(/Terlalu banyak percobaan/)).not.toBeInTheDocument();
  });

  it("LG-E4 NETWORK -> pesan server tidak terjangkau, isian tetap", async () => {
    login.mockResolvedValue({ code: "NETWORK", error: "x" });
    render(<LoginForm />);
    await kirim();
    expect(screen.getByText("Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.")).toBeInTheDocument();
    expect((screen.getByLabelText(/Email atau nomor WA/) as HTMLInputElement).value).toBe("081234567890");
  });

  it("LG-E5 NOT_MERCHANT -> pesan akun pembeli", async () => {
    login.mockResolvedValue({ code: "NOT_MERCHANT", error: "x" });
    render(<LoginForm />);
    await kirim();
    expect(screen.getByText("Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.")).toBeInTheDocument();
  });

  it("LG-A1/A2/E5/daftar banner konteks", () => {
    const { rerender } = render(<LoginForm next="/menu" />);
    expect(screen.getByText("Masuk untuk melanjutkan")).toBeInTheDocument();
    rerender(<LoginForm alasan="sesi-habis" />);
    expect(screen.getByText("Sesi berakhir, silakan masuk lagi")).toBeInTheDocument();
    rerender(<LoginForm alasan="bukan-penjual" />);
    expect(screen.getByText("Akun ini akun pembeli. Gunakan aplikasi KateringKita di ponsel.")).toBeInTheDocument();
    rerender(<LoginForm registered />);
    expect(screen.getByText("Akun berhasil dibuat. Silakan masuk.")).toBeInTheDocument();
  });

  it("LG-A4 tampilkan/sembunyikan kata sandi", () => {
    render(<LoginForm />);
    const pw = screen.getByLabelText(/^Kata sandi/);
    const tombol = screen.getByRole("button", { name: "Tampilkan kata sandi" });
    expect(tombol).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(tombol);
    expect(pw).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Sembunyikan kata sandi" })).toHaveAttribute("aria-pressed", "true");
  });
});
