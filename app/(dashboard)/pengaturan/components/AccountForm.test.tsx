// Test AccountForm: simpan nama/nomor WA login, kata sandi wajib saat nomor berubah, dan galat dari server.
// Server action dan router dipalsukan (vi.mock), jadi test berjalan tanpa backend.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/app/components/ui/Toast";
import { AccountForm } from "./AccountForm";

const updateAccount = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/account", () => ({ updateAccount: (...args: unknown[]) => updateAccount(...args) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  updateAccount.mockReset();
  refresh.mockReset();
});
const renderForm = () =>
  render(
    <>
      <AccountForm fullName="Diego" phone="081234567890" />
      <Toaster />
    </>,
  );
const save = () => userEvent.click(screen.getByRole("button", { name: "Simpan data akun" }));

describe("AccountForm", () => {
  it("tanpa perubahan tombol simpan nonaktif; ganti nama tidak meminta sandi", async () => {
    updateAccount.mockResolvedValue({ data: { user: {}, merchant: null } });
    renderForm();
    expect(screen.getByRole("button", { name: "Simpan data akun" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Nama pemilik/), " Pratama");
    expect(screen.queryByLabelText(/Kata sandi saat ini/)).not.toBeInTheDocument();
    await save();
    expect(updateAccount).toHaveBeenCalledWith({
      full_name: "Diego Pratama",
      phone: "081234567890",
      current_password: "",
    });
    expect(await screen.findByText("Data akun disimpan")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("nomor berubah: sandi wajib sebelum dikirim; galat sandi dari server tampil di field", async () => {
    updateAccount.mockResolvedValue({
      error: { code: "VALIDATION_ERROR", message: "x", fields: { current_password: ["Kata sandi lama salah."] } },
    });
    renderForm();
    const phone = screen.getByLabelText(/Nomor WA login/);
    await userEvent.clear(phone);
    await userEvent.type(phone, "081299998888");
    await save();
    expect(updateAccount).not.toHaveBeenCalled();
    expect(screen.getByText("Kata sandi saat ini wajib diisi.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Kata sandi saat ini/), "salah123");
    await save();
    expect(updateAccount).toHaveBeenCalledWith({
      full_name: "Diego",
      phone: "081299998888",
      current_password: "salah123",
    });
    expect(await screen.findByText("Kata sandi lama salah.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
