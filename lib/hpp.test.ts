import { describe, expect, it } from "vitest";
import { cekHpp, hitungHpp } from "./hpp";

describe("hitungHpp (HP-N1)", () => {
  it("contoh plan: 7000 / 0,6 dibulatkan ke atas Rp 500", () => {
    const bahan = [{ nama: "Ayam", biaya: 50000, porsi: 10 }, { nama: "Beras", biaya: 20000, porsi: 10 }];
    expect(hitungHpp(bahan, 40)).toEqual({ hpp: 7000, suggested_price: 12000 });
  });
  it("HPP dibulatkan ke atas ke bilangan bulat", () => {
    expect(hitungHpp([{ nama: "", biaya: 10000, porsi: 3 }], 0)).toEqual({ hpp: 3334, suggested_price: 3500 });
  });
  it("tanpa galat floating point pada kelipatan pas", () => {
    expect(hitungHpp([{ nama: "", biaya: 8000, porsi: 1 }], 20).suggested_price).toBe(10000);
  });
  it("margin 95 ditolak", () => {
    expect(() => hitungHpp([{ nama: "", biaya: 1000, porsi: 1 }], 95)).toThrow();
  });
});

describe("cekHpp (HP-E1)", () => {
  const ok = [{ nama: "", biaya: 1000, porsi: 1 }];
  it("margin di luar 0-90", () => {
    expect(cekHpp(ok, 95).margin).toBe("Target margin 0–90%.");
    expect(cekHpp(ok, -1).margin).toBe("Target margin 0–90%.");
    expect(cekHpp(ok, NaN).margin).toBeTruthy();
    expect(cekHpp(ok, 90)).toEqual({});
  });
  it("biaya > 0 bulat, porsi >= 1 bulat, minimal satu bahan", () => {
    const g = cekHpp([{ nama: "", biaya: 0, porsi: 0 }, { nama: "", biaya: 10.5, porsi: 1.5 }], 30);
    expect(g["0.biaya"]).toBeTruthy();
    expect(g["0.porsi"]).toBeTruthy();
    expect(g["1.biaya"]).toBeTruthy();
    expect(g["1.porsi"]).toBeTruthy();
    expect(cekHpp([], 30).bahan).toBeTruthy();
  });
});
