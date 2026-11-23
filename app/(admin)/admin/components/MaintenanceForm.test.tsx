import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/app/components/ui/Toast";
import { PemeliharaanForm } from "./MaintenanceForm";

const saveMaintenance = vi.fn();
const refresh = vi.fn();
vi.mock("@/app/actions/admin/promos", () => ({ saveMaintenance: (...a: unknown[]) => saveMaintenance(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  saveMaintenance.mockReset();
  refresh.mockReset();
});

describe("PemeliharaanForm (F27)", () => {
  it("mati: nyalakan wajib konfirmasi, mengirim pesan, lalu refresh", async () => {
    saveMaintenance.mockResolvedValue({ data: { maintenance: { aktif: true, pesan: "Sampai 14.00" } } });
    render(
      <>
        <PemeliharaanForm nilai={{ aktif: false, pesan: null }} />
        <Toaster />
      </>,
    );
    expect(screen.queryByText("Mode pemeliharaan sedang aktif.")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Pesan untuk pengguna/), { target: { value: "Sampai 14.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Nyalakan pemeliharaan" }));
    expect(saveMaintenance).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Ya, nyalakan" }));
    });
    expect(saveMaintenance).toHaveBeenCalledWith(true, "Sampai 14.00");
    expect(screen.getByText("Mode pemeliharaan dinyalakan")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("aktif: tampil status, matikan langsung; galat backend jadi toast", async () => {
    saveMaintenance.mockResolvedValue({
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
    expect(saveMaintenance).toHaveBeenCalledWith(false, "Sampai 14.00");
    expect(screen.getByText("Tingkat admin Anda tidak memiliki akses ke fitur ini.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
