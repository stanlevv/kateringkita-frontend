import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/laporan",
}));
import { RangePicker } from "./RangePicker";

const HARI_INI = "2026-10-31";
const tampil = (dari = HARI_INI, sampai = HARI_INI, galat: string | null = null) =>
  render(<RangePicker dari={dari} sampai={sampai} hariIni={HARI_INI} galat={galat} />);

beforeEach(() => replace.mockReset());

describe("LP-N1 pemilih rentang", () => {
  it("preset mengisi dari/sampai di URL", async () => {
    tampil();
    await userEvent.click(screen.getByRole("button", { name: "7 hari" }));
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-25&sampai=2026-10-31", { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: "30 hari" }));
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-02&sampai=2026-10-31", { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: "Hari ini" }));
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-31&sampai=2026-10-31", { scroll: false });
  });
  it("preset yang cocok ditandai aktif", () => {
    tampil("2026-10-25", "2026-10-31");
    expect(screen.getByRole("button", { name: "7 hari" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hari ini" })).toHaveAttribute("aria-pressed", "false");
  });
  it("Pilih tanggal menampilkan dua isian; rentang sah masuk URL", async () => {
    tampil();
    expect(screen.queryByLabelText("Dari tanggal")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pilih tanggal" }));
    fireEvent.change(screen.getByLabelText("Dari tanggal"), { target: { value: "2026-10-20" } });
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-20&sampai=2026-10-31", { scroll: false });
  });
});

describe("LP-E1 galat di pemilih", () => {
  it("akhir sebelum awal: pesan tampil, URL tidak berubah", async () => {
    tampil("2026-10-25", "2026-10-31");
    await userEvent.click(screen.getByRole("button", { name: "Pilih tanggal" }));
    fireEvent.change(screen.getByLabelText("Sampai tanggal"), { target: { value: "2026-10-10" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Tanggal akhir harus setelah tanggal awal.");
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Sampai tanggal")).toHaveAttribute("aria-invalid", "true");
  });
  it("lebih dari 92 hari", async () => {
    tampil("2026-10-25", "2026-10-31");
    await userEvent.click(screen.getByRole("button", { name: "Pilih tanggal" }));
    fireEvent.change(screen.getByLabelText("Dari tanggal"), { target: { value: "2026-01-01" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Rentang maksimal 92 hari.");
    expect(replace).not.toHaveBeenCalled();
  });
  it("galat dari URL tidak sah ditampilkan, isian terbuka", () => {
    tampil(HARI_INI, HARI_INI, "Rentang maksimal 92 hari.");
    expect(screen.getByRole("alert")).toHaveTextContent("Rentang maksimal 92 hari.");
    expect(screen.getByLabelText("Dari tanggal")).toBeInTheDocument();
  });
});
