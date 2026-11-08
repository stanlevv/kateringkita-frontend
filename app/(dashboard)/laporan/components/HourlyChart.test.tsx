import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HourlyChart } from "./HourlyChart";

const titik = [
  { hour: 10, orders: 5, portions: 11, revenue: 188_000 },
  { hour: 11, orders: 14, portions: 20, revenue: 238_000 },
  { hour: 12, orders: 12, portions: 27, revenue: 508_000 },
];

describe("LP-N2 grafik per jam", () => {
  it("satu batang per jam, bisa difokus, berlabel jam, pesanan, omzet", () => {
    render(<HourlyChart points={titik} hari={1} />);
    const batang = screen.getAllByRole("img", { name: /^Jam / });
    expect(batang).toHaveLength(3);
    batang.forEach((b) => expect(b).toHaveAttribute("tabindex", "0"));
    expect(screen.getByRole("img", { name: "Jam 11.00: 14 pesanan, Rp 238.000" })).toBeInTheDocument();
  });
  it("tabel alternatif sr-only berisi angka yang sama", () => {
    render(<HourlyChart points={titik} hari={1} />);
    const tabel = screen.getByRole("table", { name: "Penjualan per jam" });
    expect(tabel.closest(".sr-only")).not.toBeNull();
    const baris = within(tabel).getAllByRole("row");
    expect(baris).toHaveLength(4);
    expect(within(baris[2]).getByText("11.00")).toBeInTheDocument();
    expect(within(baris[2]).getByText("14")).toBeInTheDocument();
    expect(within(baris[2]).getByText("Rp 238.000")).toBeInTheDocument();
  });
  it("tooltip muncul saat fokus dan hover, hilang saat lepas", () => {
    render(<HourlyChart points={titik} hari={1} />);
    const b = screen.getByRole("img", { name: /^Jam 12/ });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.focus(b);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Jam 12.00");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Rp 508.000");
    fireEvent.blur(b);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole("img", { name: /^Jam 10/ }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Jam 10.00");
  });
  it("subjudul menyebut agregasi untuk rentang banyak hari", () => {
    const { rerender } = render(<HourlyChart points={titik} hari={1} />);
    expect(screen.queryByText(/dijumlahkan/)).not.toBeInTheDocument();
    rerender(<HourlyChart points={titik} hari={7} />);
    expect(screen.getByText(/dijumlahkan dari 7 hari/)).toBeInTheDocument();
  });
  // jsdom tidak menghitung tata letak: yang diuji hanya adanya pembungkus gulir dan lebar minimum (layar sempit).
  it("grafik dibungkus overflow-x-auto dengan lebar minimum agar label tetap terbaca", () => {
    render(<HourlyChart points={titik} hari={1} />);
    const svg = screen.getByRole("group", { name: "Grafik batang penjualan per jam" });
    expect(svg.parentElement).toHaveClass("min-w-[560px]");
    expect(svg.parentElement?.parentElement).toHaveClass("overflow-x-auto");
  });
  it("LP-S1 tanpa data -> pesan di dalam kartu", () => {
    render(<HourlyChart points={[]} hari={1} />);
    expect(screen.getByText("Belum ada penjualan di rentang ini")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
