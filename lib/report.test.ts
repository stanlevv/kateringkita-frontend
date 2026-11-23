import { describe, expect, it } from "vitest";
import { createTransactionsCsv, validateRange, countDays, parseRange, groupByHour } from "./report";
import type { Transaction } from "@/types/report";

const TODAY = "2026-10-31";

describe("LP-E1 cekRentang", () => {
  it("rentang sah -> null", () => {
    expect(validateRange("2026-10-25", "2026-10-31", TODAY)).toBeNull();
    expect(validateRange("2026-10-31", "2026-10-31", TODAY)).toBeNull();
  });
  it("akhir sebelum awal", () => {
    expect(validateRange("2026-10-20", "2026-10-10", TODAY)).toBe("Tanggal akhir harus setelah tanggal awal.");
  });
  it("maksimal 92 hari (inklusif)", () => {
    expect(validateRange("2026-08-01", "2026-10-31", TODAY)).toBeNull(); // 92 hari
    expect(validateRange("2026-07-31", "2026-10-31", TODAY)).toBe("Rentang maksimal 92 hari.");
  });
  it("tanggal melewati hari ini", () => {
    expect(validateRange("2026-10-31", "2026-11-01", TODAY)).toBe("Tanggal tidak boleh melewati hari ini.");
  });
  it("format salah", () => {
    expect(validateRange("kemarin", "2026-10-31", TODAY)).toBe("Tanggal tidak valid.");
    expect(validateRange("2026-02-30", "2026-10-31", TODAY)).toBe("Tanggal tidak valid.");
  });
});

describe("LP-N1 parseRentang", () => {
  it("tanpa parameter -> hari ini", () => {
    expect(parseRange(undefined, undefined, TODAY)).toEqual({ from: TODAY, to: TODAY, error: null });
  });
  it("sah dipakai apa adanya", () => {
    expect(parseRange("2026-10-25", "2026-10-31", TODAY)).toEqual({
      from: "2026-10-25",
      to: "2026-10-31",
      error: null,
    });
  });
  it("tidak sah -> hari ini + pesan galat (LP-E1)", () => {
    expect(parseRange("2026-10-31", "2026-10-01", TODAY)).toEqual({
      from: TODAY,
      to: TODAY,
      error: "Tanggal akhir harus setelah tanggal awal.",
    });
  });
  it("hanya satu parameter -> hari ini + galat", () => {
    expect(parseRange("2026-10-25", undefined, TODAY)).toEqual({
      from: TODAY,
      to: TODAY,
      error: "Lengkapi tanggal awal dan akhir.",
    });
    expect(parseRange(undefined, "2026-10-25", TODAY).error).toBe("Lengkapi tanggal awal dan akhir.");
  });
  it("jumlahHari inklusif", () => {
    expect(countDays("2026-10-25", "2026-10-31")).toBe(7);
    expect(countDays("2026-10-31", "2026-10-31")).toBe(1);
  });
});

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  code: "KK-20261031-AB2C",
  created_at: "2026-10-30T10:00:00.000Z",
  completed_at: "2026-10-31T04:42:00.000Z",
  customer_name: "Rafli",
  payment_method: "cod",
  total: 44000,
  hpp_total: 28000,
  status: "completed",
  menu_name: "Nasi Ayam",
  qty: 2,
  ...overrides,
});

describe("LP-N4 buatCsv", () => {
  it("header & satu baris (waktu WIB, laba = omzet - HPP)", () => {
    const [header, row] = createTransactionsCsv([makeTransaction()]).trim().split("\r\n");
    expect(header).toBe("kode,waktu,menu,qty,omzet,hpp,laba,metode");
    expect(row).toBe("KK-20261031-AB2C,2026-10-31 11:42,Nasi Ayam,2,44000,28000,16000,cod");
  });
  it("kolom waktu dari completed_at (WIB), bukan created_at", () => {
    expect(
      createTransactionsCsv([
        makeTransaction({ created_at: "2026-10-29T01:00:00.000Z", completed_at: "2026-10-31T17:30:00.000Z" }),
      ]),
    ).toContain(",2026-11-01 00:30,");
  });
  it("kutip, koma, dan baris baru di-escape", () => {
    const csv = createTransactionsCsv([makeTransaction({ menu_name: 'Nasi "Spesial", pedas\nlevel 3' })]);
    expect(csv).toContain('"Nasi ""Spesial"", pedas\nlevel 3"');
  });
  it.each(["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx"])("menetralkan awalan rumus %j", (value) => {
    const csv = createTransactionsCsv([makeTransaction({ menu_name: value })]);
    expect(csv).toContain(`'${value}`);
    expect(csv).not.toMatch(new RegExp(`[,"]${value.replace(/[+$()]/g, "\\$&")}`));
  });
  it("angka negatif (laba rugi) tetap angka", () => {
    expect(createTransactionsCsv([makeTransaction({ total: 1000, hpp_total: 3000 })])).toContain(",1000,3000,-2000,");
  });
});

describe("LP-N2 perJam", () => {
  it("menjumlah per jam WIB, urut jam", () => {
    const result = groupByHour([
      makeTransaction({ code: "A", completed_at: "2026-10-31T04:10:00.000Z", total: 10000, qty: 1 }),
      makeTransaction({ code: "B", completed_at: "2026-10-30T04:50:00.000Z", total: 20000, qty: 3 }),
      makeTransaction({ code: "C", completed_at: "2026-10-31T01:00:00.000Z", total: 5000, qty: 1 }),
    ]);
    expect(result).toEqual([
      { hour: 8, orders: 1, portions: 1, revenue: 5000 },
      { hour: 11, orders: 2, portions: 4, revenue: 30000 },
    ]);
  });
  it("satu pesanan dengan dua baris menu dihitung sebagai satu pesanan", () => {
    const result = groupByHour([
      makeTransaction({ code: "A", menu_name: "Nasi", completed_at: "2026-10-31T04:10:00.000Z", total: 10000, qty: 1 }),
      makeTransaction({ code: "A", menu_name: "Teh", completed_at: "2026-10-31T04:10:00.000Z", total: 4000, qty: 2 }),
    ]);
    expect(result).toEqual([{ hour: 11, orders: 1, portions: 3, revenue: 14000 }]);
  });
});
