// Test AdminForm dan AccountStatusToggle: validasi, galat server per kolom, sesudah simpan, dan konfirmasi nonaktifkan.
// Router dan server action dipalsukan (vi.mock), jadi test berjalan tanpa backend.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/app/components/ui/Toast";
import { AccountStatusToggle } from "./AccountStatusToggle";
import { AdminForm } from "./AdminForm";

const push = vi.fn();
const refresh = vi.fn();
const setMerchantAccountActive = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/app/actions/admin/merchant-edit", () => ({
  setMerchantAccountActive: (...args: unknown[]) => setMerchantAccountActive(...args),
}));
vi.mock("@/app/actions/admin/customers", () => ({ setCustomerActive: vi.fn() }));

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  setMerchantAccountActive.mockReset();
});

const fields = [
  { name: "full_name", label: "Nama", required: true },
  { name: "phone", label: "Nomor WA", type: "tel" as const, digitsOnly: true },
];
const validate = (values: Record<string, string>): Record<string, string> =>
  values.full_name.trim() ? {} : { full_name: "Nama wajib diisi." };

describe("AdminForm", () => {
  it("galat browser mencegah kirim; galat server tampil di kolomnya; sukses lalu pindah ke alamat dengan id", async () => {
    const submit = vi
      .fn()
      .mockResolvedValueOnce({ error: { code: "CONFLICT", message: "x", fields: { phone: ["Nomor sudah dipakai."] } } })
      .mockResolvedValueOnce({ data: { id: 42 } });
    render(
      <>
        <AdminForm
          id="uji"
          fields={fields}
          initial={{ full_name: "", phone: "" }}
          validate={validate}
          submit={submit}
          submitLabel="Simpan"
          successMessage="Tersimpan"
          afterSave={{ goTo: "/admin/pembeli/{id}" }}
        />
        <Toaster />
      </>,
    );
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Nomor WA/), "08a12");
    expect(screen.getByLabelText(/Nomor WA/)).toHaveValue("0812");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Nama wajib diisi\./).length).toBeGreaterThan(0);
    await userEvent.type(screen.getByLabelText(/^Nama/), "Dewi");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(submit).toHaveBeenCalledWith({ full_name: "Dewi", phone: "0812" });
    expect((await screen.findAllByText(/Nomor sudah dipakai\./)).length).toBeGreaterThan(0);
    // galat server baru hilang setelah kolomnya diubah
    await userEvent.type(screen.getByLabelText(/Nomor WA/), "3");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText("Tersimpan")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/admin/pembeli/42");
  });

  it("bawaan sesudah simpan: muat ulang halaman", async () => {
    const submit = vi.fn().mockResolvedValue({ data: { id: 1 } });
    render(
      <AdminForm
        id="uji2"
        fields={fields}
        initial={{ full_name: "Dewi", phone: "" }}
        validate={validate}
        submit={submit}
        submitLabel="Simpan"
        successMessage="Tersimpan"
      />,
    );
    await userEvent.type(screen.getByLabelText(/^Nama/), " L");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(refresh).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("AccountStatusToggle", () => {
  it("nonaktifkan butuh konfirmasi; support hanya melihat status", async () => {
    setMerchantAccountActive.mockResolvedValue({ data: {} });
    const { rerender } = render(
      <>
        <AccountStatusToggle kind="merchant" id={7} active canEdit />
        <Toaster />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan akun" }));
    expect(setMerchantAccountActive).not.toHaveBeenCalled();
    expect(screen.getByText(/Tokonya juga hilang dari katalog/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ya, nonaktifkan" }));
    expect(setMerchantAccountActive).toHaveBeenCalledWith(7, false);
    expect(await screen.findByText("Akun dinonaktifkan")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    rerender(<AccountStatusToggle kind="merchant" id={7} active={false} canEdit={false} />);
    expect(screen.getByText("Akun nonaktif")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aktifkan akun" })).toBeNull();
  });
});
