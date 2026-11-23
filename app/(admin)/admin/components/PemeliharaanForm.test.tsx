import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/app/components/ui/Toast";
import { PemeliharaanForm } from "./PemeliharaanForm";

const simpanPemeliharaan = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/admin/promos", () => ({ simpanPemeliharaan: (...a: unknown[]) => simpanPemeliharaan(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  simpanPemeliharaan.mockReset();
  refresh.mockReset();
});

describe("PemeliharaanForm (F27)", () => {
  it("mati: nyalakan wajib konfirmasi, mengirim pesan, lalu refresh", async () => {
    simpanPemeliharaan.mockResolvedValue({ data: { maintenance: { aktif: true, pesan: "Sampai 14.00" } } });
    render(
      <>
        <PemeliharaanForm nilai={{ aktif: false, pesan: null }} />
        <Toaster />
      </>,
    );
    expect(screen.queryByText("Mode pemeliharaan sedang aktif.")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Pesan untuk pengguna/), { target: { value: "Sampai 14.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Nyalakan pemeliharaan" }));
    expect(simpanPemeliharaan).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Ya, nyalakan" }));
    });
    expect(simpanPemeliharaan).toHaveBeenCalledWith(true, "Sampai 14.00");
    expect(screen.getByText("Mode pemeliharaan dinyalakan")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("aktif: tampil status, matikan langsung; galat backend jadi toast", async () => {
    simpanPemeliharaan.mockResolvedValue({
      error: { code: "FORBIDDEN", message: "Tingkat admin Anda tidak memiliki akses ke fitur ini." },
    });
    render(
      <>
        <PemeliharaanForm nilai={{ aktif: true, pesan: "Sampai 14.00" }} />
        <Toaster />
      </>,
    );
    expect(screen.getByText("Mode pemeliharaan sedang aktif.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Pesan untuk pengguna/)).toHaveValue("Sampai 14.00");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Matikan pemeliharaan" }));
    });
    expect(simpanPemeliharaan).toHaveBeenCalledWith(false, "Sampai 14.00");
    expect(screen.getByText("Tingkat admin Anda tidak memiliki akses ke fitur ini.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
