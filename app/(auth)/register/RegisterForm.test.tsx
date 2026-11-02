import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import RegisterForm from "./RegisterForm";

const registerMerchant = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/auth", () => ({ registerMerchant: (...a: unknown[]) => registerMerchant(...a) }));

const types = [{ id: 1, name: "Katering Harian" }, { id: 2, name: "Katering Acara" }];
const isi = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const klik = async (name: string) => { await act(async () => { fireEvent.click(screen.getByRole("button", { name })); }); };

async function langkah1(phone = "081234567890") {
  isi(/Nama lengkap/, "Budi Santoso");
  isi(/Nomor WA/, phone);
  isi(/^Kata sandi/, "rahasia123");
  isi(/Konfirmasi kata sandi/, "rahasia123");
  await klik("Lanjut");
}
async function langkah2() {
  isi(/Nama usaha/, "Dapur Budi");
  isi(/Jenis usaha/, "1");
  isi(/Alamat/, "Jl. Kampus 1");
}

beforeEach(() => { registerMerchant.mockReset(); refresh.mockReset(); });

describe("register", () => {
  it("stepper terlihat", () => {
    render(<RegisterForm types={types} typesFailed={false} />);
    expect(screen.getAllByText("Data pemilik").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Data usaha").length).toBeGreaterThan(0);
  });

  it("RG-E1 langkah 1 tidak lanjut bila no WA 0712…", async () => {
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1("071234567890");
    expect(screen.queryByLabelText(/Nama usaha/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Nomor WA harus diawali 08 dan 10–13 digit.").length).toBeGreaterThan(0);
  });

  it("RG-A1 Kembali mempertahankan isian", async () => {
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1();
    await klik("Kembali");
    expect((screen.getByLabelText(/Nomor WA/) as HTMLInputElement).value).toBe("081234567890");
  });

  it("RG-E2 409 dengan fields.phone -> kembali ke langkah 1 + tautan Masuk", async () => {
    registerMerchant.mockResolvedValue({ code: "CONFLICT", error: "x", fields: { phone: ["Nomor WA sudah terdaftar."] } });
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1();
    await langkah2();
    await klik("Daftar");
    expect(screen.getByLabelText(/Nomor WA/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("Nomor WA sudah terdaftar.").length).toBeGreaterThan(0);
    expect(screen.getByText(/sudah terdaftar. Sudah punya akun/)).toBeInTheDocument();
    for (const a of screen.getAllByRole("link", { name: "Masuk" })) expect(a).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: "Masuk" }).length).toBeGreaterThanOrEqual(2);
  });

  it("RG-E4 jaringan gagal -> banner, isian tetap", async () => {
    registerMerchant.mockResolvedValue({ code: "NETWORK", error: "x" });
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1();
    await langkah2();
    await klik("Daftar");
    expect(screen.getByText("Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.")).toBeInTheDocument();
    expect((screen.getByLabelText(/Nama usaha/) as HTMLInputElement).value).toBe("Dapur Budi");
  });

  it("RG-E2 409 polos tanpa fields -> kalimat tetap di field no WA", async () => {
    registerMerchant.mockResolvedValue({ code: "CONFLICT", error: "Data sudah terdaftar." });
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1();
    await langkah2();
    await klik("Daftar");
    expect(screen.getByLabelText(/Nomor WA/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("Nomor WA atau email ini sudah terdaftar.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Data sudah terdaftar.")).not.toBeInTheDocument();
  });

  it("error non-field (429) -> banner, bukan di Nama usaha", async () => {
    registerMerchant.mockResolvedValue({ code: "RATE_LIMITED", error: "Terlalu banyak permintaan." });
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1();
    await langkah2();
    await klik("Daftar");
    expect(screen.getByText("Terlalu banyak permintaan.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama usaha/)).not.toHaveAttribute("aria-invalid");
  });

  it("fokus pindah ke judul langkah / judul Berhasil", async () => {
    registerMerchant.mockResolvedValue({ ok: true });
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1();
    expect(screen.getByRole("heading", { name: "Data usaha" })).toHaveFocus();
    await klik("Kembali");
    expect(screen.getByRole("heading", { name: "Data pemilik" })).toHaveFocus();
    await klik("Lanjut");
    await langkah2();
    await klik("Daftar");
    expect(screen.getByRole("heading", { name: "Akun berhasil dibuat" })).toHaveFocus();
  });

  it("RG-N1 sukses -> layar Berhasil tanpa login otomatis", async () => {
    registerMerchant.mockResolvedValue({ ok: true });
    render(<RegisterForm types={types} typesFailed={false} />);
    await langkah1();
    await langkah2();
    await klik("Daftar");
    expect(screen.getByText("Akun berhasil dibuat")).toBeInTheDocument();
    expect(screen.getByText("Dapur Budi")).toBeInTheDocument();
    expect(screen.getByText("Lengkapi pengaturan toko")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Masuk ke dashboard" })).toHaveAttribute("href", "/login?registered=1");
  });
});

describe("RG-E3", () => {
  it("jenis usaha gagal dimuat di langkah 2", async () => {
    render(<RegisterForm types={[]} typesFailed />);
    await langkah1();
    expect(screen.getByText("Daftar jenis usaha gagal dimuat.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect((screen.getByLabelText(/Nama usaha/) as HTMLInputElement).value).toBe("");
  });
});
