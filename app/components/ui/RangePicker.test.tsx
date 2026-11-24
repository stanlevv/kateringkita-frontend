// Test RangePicker: preset dan tanggal sendiri mengisi URL; rentang tidak sah ditolak tanpa mengubah URL.
// Modul Next.js dan server action dipalsukan (vi.mock) agar test tidak butuh server.
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/laporan",
}));
import { RangePicker } from "./RangePicker";

const TODAY = "2026-10-31";
const renderPicker = (from = TODAY, to = TODAY, error: string | null = null) =>
  render(<RangePicker from={from} to={to} today={TODAY} error={error} />);

beforeEach(() => replace.mockReset());

describe("pemilih rentang", () => {
  it("preset mengisi dari/sampai di URL", async () => {
    renderPicker();
    await userEvent.click(screen.getByRole("button", { name: "7 hari" }));
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-25&sampai=2026-10-31", { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: "30 hari" }));
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-02&sampai=2026-10-31", { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: "Hari ini" }));
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-31&sampai=2026-10-31", { scroll: false });
  });
  it("preset yang cocok ditandai aktif", () => {
    renderPicker("2026-10-25", "2026-10-31");
    expect(screen.getByRole("button", { name: "7 hari" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hari ini" })).toHaveAttribute("aria-pressed", "false");
  });
  it("Pilih tanggal menampilkan dua isian; rentang sah masuk URL", async () => {
    renderPicker();
    expect(screen.queryByLabelText("Dari tanggal")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pilih tanggal" }));
    fireEvent.change(screen.getByLabelText("Dari tanggal"), { target: { value: "2026-10-20" } });
    expect(replace).toHaveBeenLastCalledWith("/laporan?dari=2026-10-20&sampai=2026-10-31", { scroll: false });
  });
});

describe("galat di pemilih", () => {
  it("akhir sebelum awal: pesan tampil, URL tidak berubah", async () => {
    renderPicker("2026-10-25", "2026-10-31");
    await userEvent.click(screen.getByRole("button", { name: "Pilih tanggal" }));
    fireEvent.change(screen.getByLabelText("Sampai tanggal"), { target: { value: "2026-10-10" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Tanggal akhir harus setelah tanggal awal.");
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Sampai tanggal")).toHaveAttribute("aria-invalid", "true");
  });
  it("lebih dari 92 hari", async () => {
    renderPicker("2026-10-25", "2026-10-31");
    await userEvent.click(screen.getByRole("button", { name: "Pilih tanggal" }));
    fireEvent.change(screen.getByLabelText("Dari tanggal"), { target: { value: "2026-01-01" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Rentang maksimal 92 hari.");
    expect(replace).not.toHaveBeenCalled();
  });
  it("galat dari URL tidak sah ditampilkan, isian terbuka", () => {
    renderPicker(TODAY, TODAY, "Rentang maksimal 92 hari.");
    expect(screen.getByRole("alert")).toHaveTextContent("Rentang maksimal 92 hari.");
    expect(screen.getByLabelText("Dari tanggal")).toBeInTheDocument();
  });
});
