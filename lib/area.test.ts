// Test util slug dan parsing id halaman area titik ambil.
import { describe, expect, it } from "vitest";
import { AREA_MIN_STORES, areaSlug, parseAreaId } from "@/lib/area";

describe("areaSlug", () => {
  it("memberi awalan id dan menormalkan nama", () => {
    expect(areaSlug({ id: 1, name: "Gedung Vokasi UB (Lt. 2)" })).toBe("1-gedung-vokasi-ub-lt-2");
  });
  it("membuang simbol di ujung nama", () => {
    expect(areaSlug({ id: 7, name: "Gazebo Barat!!" })).toBe("7-gazebo-barat");
  });
});

describe("parseAreaId", () => {
  it("mengambil id dari awalan angka", () => {
    expect(parseAreaId("3-gazebo")).toBe(3);
    expect(parseAreaId("3")).toBe(3);
  });
  it("menolak param tidak valid", () => {
    for (const p of ["abc", "0-x", "-1", "3x", "", "1234567890-x"]) expect(parseAreaId(p)).toBeNull();
  });
  it("ambang minimal toko adalah 2", () => {
    expect(AREA_MIN_STORES).toBe(2);
  });
});
