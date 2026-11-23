// Test HppCalculator: hasil langsung dan tautan Pakai untuk menu, galat per isian, dan hapus baris bahan.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HppCalculator } from "./HppCalculator";

const typeInto = async (label: string | RegExp, text: string, i = 0) => {
  const field = screen.getAllByLabelText(label)[i];
  await userEvent.clear(field);
  if (text) await userEvent.type(field, text);
};

describe("HppCalculator (HP-N1, HP-N2, HP-E1)", () => {
  it("hasil langsung dan tautan Pakai untuk menu", async () => {
    render(<HppCalculator />);
    await typeInto(/Biaya/, "50000");
    await typeInto(/Porsi/, "10");
    await userEvent.click(screen.getByRole("button", { name: "Tambah bahan" }));
    await typeInto(/Biaya/, "20000", 1);
    await typeInto(/Porsi/, "10", 1);
    await typeInto(/Target margin/, "40");
    expect(screen.getByTestId("hpp")).toHaveTextContent("Rp 7.000");
    expect(screen.getByTestId("harga")).toHaveTextContent("Rp 12.000");
    expect(screen.getByRole("link", { name: "Pakai untuk menu" })).toHaveAttribute(
      "href",
      "/menu/baru?hpp=7000&price=12000",
    );
  });

  it("HP-E1 margin 95 dan biaya 0 -> error per field, tanpa hasil", async () => {
    render(<HppCalculator />);
    await typeInto(/Biaya/, "0");
    await typeInto(/Porsi/, "1");
    await typeInto(/Target margin/, "95");
    await userEvent.tab();
    expect(screen.getByText("Target margin 0–90%.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pakai untuk menu" })).toBeNull();
    await userEvent.click(screen.getAllByLabelText(/Biaya/)[0]);
    await userEvent.tab();
    expect(screen.getByText("Biaya harus bilangan bulat lebih dari 0.")).toBeInTheDocument();
  });

  it("hapus bahan; baris terakhir tidak bisa dihapus", async () => {
    render(<HppCalculator />);
    await userEvent.click(screen.getByRole("button", { name: "Tambah bahan" }));
    expect(screen.getAllByLabelText(/Biaya/)).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Hapus bahan 2" }));
    expect(screen.getAllByLabelText(/Biaya/)).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Hapus bahan 1" })).toBeNull();
  });
});
