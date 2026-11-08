import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportKpis } from "./ReportKpis";

const summary = { target: 3_500_000, revenue: 2_270_000, hpp_total: 1_453_500, profit: 816_500, achievement_pct: 65, orders: 21 };

describe("LP-N1 KPI (nilai dari API)", () => {
  it("capaian = achievement_pct dari API + bar, target dan pesanan selesai dari summary", () => {
    render(<ReportKpis summary={summary} />);
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Capaian target" })).toHaveAttribute("aria-valuenow", "65");
    expect(screen.getByText(/Target Rp 3\.500\.000/)).toBeInTheDocument();
    expect(screen.getByText("Rp 1.453.500")).toBeInTheDocument();
    expect(screen.getByText("Rp 816.500")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
  });
  it("bar dijepit 100, angka persen boleh lebih dari 100", () => {
    render(<ReportKpis summary={{ ...summary, achievement_pct: 137 }} />);
    expect(screen.getByText("137%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
  it("LP-A1 target 0 -> tautan Atur target ke Pengaturan, tanpa bar", () => {
    render(<ReportKpis summary={{ ...summary, target: 0, achievement_pct: 0 }} />);
    expect(screen.getByText(/Target harian belum diisi\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Atur target" })).toHaveAttribute("href", "/pengaturan#operasional");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
  it("LP-S1 omzet 0 tetap menampilkan 0", () => {
    render(<ReportKpis summary={{ ...summary, revenue: 0, hpp_total: 0, profit: 0, achievement_pct: 0, orders: 0 }} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 0")).toHaveLength(3);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
