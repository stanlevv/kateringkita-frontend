import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiRow } from "./KpiRow";

const kpi = (label: string) => within(screen.getByRole("region", { name: "Ringkasan hari ini" })).getByText(label).nextElementSibling;
const R = { omzet: 125_000, kapasitas: { terpakai: 30, total: 120 }, perluTindakan: 4, rataSiapMenit: 12, terlaris: null };

describe("KpiRow (M-04, D2)", () => {
  it("angka dari ringkasan; tanpa teks vs kemarin", () => {
    render(<KpiRow ringkasan={R} />);
    expect(kpi("Omzet hari ini")).toHaveTextContent("Rp 125.000");
    expect(kpi("Kapasitas terpakai")).toHaveTextContent("30/120");
    expect(screen.getByRole("progressbar", { name: "Kapasitas terpakai" })).toHaveAttribute("aria-valuenow", "25");
    expect(kpi("Perlu tindakan")).toHaveTextContent("4");
    expect(screen.getByText("pesanan menunggu Anda")).toBeInTheDocument();
    expect(kpi("Rata-rata siap")).toHaveTextContent("12 menit");
    expect(screen.queryByText(/kemarin/)).toBeNull();
  });
  it("rataSiapMenit null -> —; kapasitas total 0 -> 0 %", () => {
    render(<KpiRow ringkasan={{ ...R, rataSiapMenit: null, kapasitas: { terpakai: 0, total: 0 } }} />);
    expect(kpi("Rata-rata siap")).toHaveTextContent("—");
    expect(screen.getByText("belum ada pesanan siap hari ini")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Kapasitas terpakai" })).toHaveAttribute("aria-valuenow", "0");
  });
});
