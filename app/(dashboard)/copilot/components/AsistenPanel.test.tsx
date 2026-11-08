import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AsistenPanel } from "./AsistenPanel";

const tanyaAsisten = vi.fn();
vi.mock("@/app/actions/asisten", () => ({ tanyaAsisten: (...a: unknown[]) => tanyaAsisten(...a) }));

beforeEach(() => tanyaAsisten.mockReset());

describe("F17 AsistenPanel", () => {
  it("pertanyaan kosong tidak dikirim", async () => {
    render(<AsistenPanel />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tanya asisten" })); });
    expect(screen.getByText("Tulis pertanyaan dulu.")).toBeInTheDocument();
    expect(tanyaAsisten).not.toHaveBeenCalled();
  });
  it("contoh pertanyaan langsung dikirim dan jawaban tampil", async () => {
    tanyaAsisten.mockResolvedValue({ data: { answer: "Naikkan Risol ke Rp 6.000." } });
    render(<AsistenPanel />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /margin-nya paling tipis/ })); });
    expect(tanyaAsisten).toHaveBeenCalledWith(expect.stringContaining("margin-nya paling tipis"));
    expect(screen.getByText("Naikkan Risol ke Rp 6.000.")).toBeInTheDocument();
  });
  it("asisten belum aktif (503) -> pesan jelas", async () => {
    tanyaAsisten.mockResolvedValue({ error: { code: "SERVICE_UNAVAILABLE", message: "Asisten AI belum diaktifkan." } });
    render(<AsistenPanel />);
    fireEvent.change(screen.getByLabelText("Pertanyaan"), { target: { value: "Halo" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tanya asisten" })); });
    expect(screen.getByText("Asisten AI belum diaktifkan di server.")).toBeInTheDocument();
  });
});
