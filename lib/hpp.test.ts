// Test kalkulator HPP: validasi isian dan perhitungan harga jual.
import { describe, expect, it } from "vitest";
import { validateHpp, calculateHpp } from "./hpp";

describe("hitungHpp (HP-N1)", () => {
  it("contoh plan: 7000 / 0,6 dibulatkan ke atas Rp 500", () => {
    const ingredients = [
      { name: "Ayam", cost: 50000, portions: 10 },
      { name: "Beras", cost: 20000, portions: 10 },
    ];
    expect(calculateHpp(ingredients, 40)).toEqual({ hpp: 7000, suggested_price: 12000 });
  });
  it("HPP dibulatkan ke atas ke bilangan bulat", () => {
    expect(calculateHpp([{ name: "", cost: 10000, portions: 3 }], 0)).toEqual({ hpp: 3334, suggested_price: 3500 });
  });
  it("tanpa galat floating point pada kelipatan pas", () => {
    expect(calculateHpp([{ name: "", cost: 8000, portions: 1 }], 20).suggested_price).toBe(10000);
  });
  it("margin 95 ditolak", () => {
    expect(() => calculateHpp([{ name: "", cost: 1000, portions: 1 }], 95)).toThrow();
  });
});

describe("cekHpp (HP-E1)", () => {
  const ok = [{ name: "", cost: 1000, portions: 1 }];
  it("margin di luar 0-90", () => {
    expect(validateHpp(ok, 95).margin).toBe("Target margin 0–90%.");
    expect(validateHpp(ok, -1).margin).toBe("Target margin 0–90%.");
    expect(validateHpp(ok, NaN).margin).toBeTruthy();
    expect(validateHpp(ok, 90)).toEqual({});
  });
  it("biaya > 0 bulat, porsi >= 1 bulat, minimal satu bahan", () => {
    const errors = validateHpp(
      [
        { name: "", cost: 0, portions: 0 },
        { name: "", cost: 10.5, portions: 1.5 },
      ],
      30,
    );
    expect(errors["0.biaya"]).toBeTruthy();
    expect(errors["0.porsi"]).toBeTruthy();
    expect(errors["1.biaya"]).toBeTruthy();
    expect(errors["1.porsi"]).toBeTruthy();
    expect(validateHpp([], 30).bahan).toBeTruthy();
  });
});
