// Test formulir daftar penjual (RegisterForm): stepper dua langkah, validasi nomor WA, isian tetap saat kembali,
// galat 409/jaringan/429 dari server, perpindahan fokus, layar berhasil, dan jenis usaha gagal dimuat.
// Server action registerMerchant dan router dipalsukan (vi.mock).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import RegisterForm from "./RegisterForm";

const registerMerchant = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/auth", () => ({ registerMerchant: (...args: unknown[]) => registerMerchant(...args) }));

const types = [
  { id: 1, name: "Katering Harian" },
  { id: 2, name: "Katering Acara" },
];
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
};

async function fillOwnerStep(phone = "081234567890") {
  fill(/Nama lengkap/, "Budi Santoso");
  fill(/Nomor WA/, phone);
  fill(/^Kata sandi/, "rahasia123");
  fill(/Konfirmasi kata sandi/, "rahasia123");
  await click("Lanjut");
}
async function fillBusinessStep() {
  fill(/Nama usaha/, "Dapur Budi");
  fill(/Jenis usaha/, "1");
  fill(/Alamat/, "Jl. Kampus 1");
}

beforeEach(() => {
  registerMerchant.mockReset();
  refresh.mockReset();
});

describe("register", () => {
  it("stepper terlihat", () => {
    render(<RegisterForm types={types} typesFailed={false} />);
    expect(screen.getAllByText("Data pemilik").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Data usaha").length).toBeGreaterThan(0);
  });

  it("langkah 1 tidak lanjut bila no WA 0712…", async () => {
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep("071234567890");
    expect(screen.queryByLabelText(/Nama usaha/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Nomor WA harus diawali 08 dan 10–13 digit.").length).toBeGreaterThan(0);
  });

  it("Kembali mempertahankan isian", async () => {
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep();
    await click("Kembali");
    expect((screen.getByLabelText(/Nomor WA/) as HTMLInputElement).value).toBe("081234567890");
  });

  it("409 dengan fields.phone -> kembali ke langkah 1 + tautan Masuk", async () => {
    registerMerchant.mockResolvedValue({
      code: "CONFLICT",
      error: "x",
      fields: { phone: ["Nomor WA sudah terdaftar."] },
    });
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep();
    await fillBusinessStep();
    await click("Daftar");
    expect(screen.getByLabelText(/Nomor WA/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("Nomor WA sudah terdaftar.").length).toBeGreaterThan(0);
    expect(screen.getByText(/sudah terdaftar. Sudah punya akun/)).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Masuk" })) expect(link).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: "Masuk" }).length).toBeGreaterThanOrEqual(2);
  });

  it("jaringan gagal -> banner, isian tetap", async () => {
    registerMerchant.mockResolvedValue({ code: "NETWORK", error: "x" });
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep();
    await fillBusinessStep();
    await click("Daftar");
    expect(screen.getByText("Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.")).toBeInTheDocument();
    expect((screen.getByLabelText(/Nama usaha/) as HTMLInputElement).value).toBe("Dapur Budi");
  });

  it("409 polos tanpa fields -> kalimat tetap di field no WA", async () => {
    registerMerchant.mockResolvedValue({ code: "CONFLICT", error: "Data sudah terdaftar." });
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep();
    await fillBusinessStep();
    await click("Daftar");
    expect(screen.getByLabelText(/Nomor WA/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("Nomor WA atau email ini sudah terdaftar.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Data sudah terdaftar.")).not.toBeInTheDocument();
  });

  it("error non-field (429) -> banner, bukan di Nama usaha", async () => {
    registerMerchant.mockResolvedValue({ code: "RATE_LIMITED", error: "Terlalu banyak permintaan." });
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep();
    await fillBusinessStep();
    await click("Daftar");
    expect(screen.getByText("Terlalu banyak permintaan.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).not.toHaveAttribute("aria-invalid");
  });

  it("fokus pindah ke judul langkah / judul Berhasil", async () => {
    registerMerchant.mockResolvedValue({ ok: true });
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep();
    expect(screen.getByRole("heading", { name: "Data usaha" })).toHaveFocus();
    await click("Kembali");
    expect(screen.getByRole("heading", { name: "Data pemilik" })).toHaveFocus();
    await click("Lanjut");
    await fillBusinessStep();
    await click("Daftar");
    expect(screen.getByRole("heading", { name: "Akun berhasil dibuat" })).toHaveFocus();
  });

  it("sukses -> layar Berhasil tanpa login otomatis", async () => {
    registerMerchant.mockResolvedValue({ ok: true });
    render(<RegisterForm types={types} typesFailed={false} />);
    await fillOwnerStep();
    await fillBusinessStep();
    await click("Daftar");
    expect(screen.getByText("Akun berhasil dibuat")).toBeInTheDocument();
    expect(screen.getByText("Dapur Budi")).toBeInTheDocument();
    expect(screen.getByText("Lengkapi pengaturan toko")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Masuk ke dashboard" })).toHaveAttribute("href", "/login?registered=1");
  });
});

describe("jenis usaha gagal dimuat", () => {
  it("jenis usaha gagal dimuat di langkah 2", async () => {
    render(<RegisterForm types={[]} typesFailed />);
    await fillOwnerStep();
    expect(screen.getByText("Daftar jenis usaha gagal dimuat.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect((screen.getByLabelText(/Nama usaha/) as HTMLInputElement).value).toBe("");
  });
});
