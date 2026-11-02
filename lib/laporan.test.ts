import { describe, expect, it } from "vitest";
import { buatCsv, cekRentang, jumlahHari, parseRentang, perJam } from "./laporan";
import type { Transaction } from "./types";

const HARI_INI = "2026-10-31";

describe("LP-E1 cekRentang", () => {
  it("rentang sah -> null", () => {
    expect(cekRentang("2026-10-25", "2026-10-31", HARI_INI)).toBeNull();
    expect(cekRentang("2026-10-31", "2026-10-31", HARI_INI)).toBeNull();
  });
  it("akhir sebelum awal", () => {
    expect(cekRentang("2026-10-20", "2026-10-10", HARI_INI)).toBe("Tanggal akhir harus setelah tanggal awal.");
  });
  it("maksimal 92 hari (inklusif)", () => {
    expect(cekRentang("2026-08-01", "2026-10-31", HARI_INI)).toBeNull(); // 92 hari
    expect(cekRentang("2026-07-31", "2026-10-31", HARI_INI)).toBe("Rentang maksimal 92 hari.");
  });
  it("tanggal melewati hari ini", () => {
    expect(cekRentang("2026-10-31", "2026-11-01", HARI_INI)).toBe("Tanggal tidak boleh melewati hari ini.");
  });
  it("format salah", () => {
    expect(cekRentang("kemarin", "2026-10-31", HARI_INI)).toBe("Tanggal tidak valid.");
    expect(cekRentang("2026-02-30", "2026-10-31", HARI_INI)).toBe("Tanggal tidak valid.");
  });
});

describe("LP-N1 parseRentang", () => {
  it("tanpa parameter -> hari ini", () => {
    expect(parseRentang(undefined, undefined, HARI_INI)).toEqual({ dari: HARI_INI, sampai: HARI_INI, galat: null });
  });
  it("sah dipakai apa adanya", () => {
    expect(parseRentang("2026-10-25", "2026-10-31", HARI_INI)).toEqual({ dari: "2026-10-25", sampai: "2026-10-31", galat: null });
  });
  it("tidak sah -> hari ini + pesan galat (LP-E1)", () => {
    expect(parseRentang("2026-10-31", "2026-10-01", HARI_INI)).toEqual({ dari: HARI_INI, sampai: HARI_INI, galat: "Tanggal akhir harus setelah tanggal awal." });
  });
  it("hanya satu parameter -> hari ini + galat", () => {
    expect(parseRentang("2026-10-25", undefined, HARI_INI)).toEqual({ dari: HARI_INI, sampai: HARI_INI, galat: "Lengkapi tanggal awal dan akhir." });
    expect(parseRentang(undefined, "2026-10-25", HARI_INI).galat).toBe("Lengkapi tanggal awal dan akhir.");
  });
  it("jumlahHari inklusif", () => {
    expect(jumlahHari("2026-10-25", "2026-10-31")).toBe(7);
    expect(jumlahHari("2026-10-31", "2026-10-31")).toBe(1);
  });
});

const trx = (o: Partial<Transaction> = {}): Transaction => ({
  code: "KK-20261031-AB2C",
  created_at: "2026-10-31T04:42:00.000Z",
  customer_name: "Rafli",
  payment_method: "cod",
  total: 44000,
  hpp_total: 28000,
  status: "completed",
  menu_name: "Nasi Ayam",
  qty: 2,
  ...o,
});

describe("LP-N4 buatCsv", () => {
  it("header & satu baris (waktu WIB, laba = omzet - HPP)", () => {
    const [h, b] = buatCsv([trx()]).trim().split("\r\n");
    expect(h).toBe("kode,waktu,menu,qty,omzet,hpp,laba,metode");
    expect(b).toBe("KK-20261031-AB2C,2026-10-31 11:42,Nasi Ayam,2,44000,28000,16000,cod");
  });
  it("kutip, koma, dan baris baru di-escape", () => {
    const csv = buatCsv([trx({ menu_name: 'Nasi "Spesial", pedas\nlevel 3' })]);
    expect(csv).toContain('"Nasi ""Spesial"", pedas\nlevel 3"');
  });
  it.each(["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx"])("menetralkan awalan rumus %j", (v) => {
    const csv = buatCsv([trx({ menu_name: v })]);
    expect(csv).toContain(`'${v}`);
    expect(csv).not.toMatch(new RegExp(`[,"]${v.replace(/[+$()]/g, "\\$&")}`));
  });
  it("angka negatif (laba rugi) tetap angka", () => {
    expect(buatCsv([trx({ total: 1000, hpp_total: 3000 })])).toContain(",1000,3000,-2000,");
  });
});

describe("LP-N2 perJam", () => {
  it("menjumlah per jam WIB, urut jam", () => {
    const r = perJam([
      trx({ created_at: "2026-10-31T04:10:00.000Z", total: 10000, qty: 1 }),
      trx({ created_at: "2026-10-30T04:50:00.000Z", total: 20000, qty: 3 }),
      trx({ created_at: "2026-10-31T01:00:00.000Z", total: 5000, qty: 1 }),
    ]);
    expect(r).toEqual([
      { hour: 8, orders: 1, portions: 1, revenue: 5000 },
      { hour: 11, orders: 2, portions: 4, revenue: 30000 },
    ]);
  });
});
