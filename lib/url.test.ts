import { describe, expect, it } from "vitest";
import { buildUrl } from "./url";

describe("urlDengan", () => {
  it("menambah, mengganti, dan menghapus parameter", () => {
    expect(buildUrl("/pesanan", "q=a&status=ready", { q: "b", page: "2", status: null })).toBe("/pesanan?q=b&page=2");
    expect(buildUrl("/pesanan", new URLSearchParams("q=a"), { tanggal: "2026-10-31" })).toBe(
      "/pesanan?q=a&tanggal=2026-10-31",
    );
  });
  it("semua kosong -> tanpa '?'", () => {
    expect(buildUrl("/menu", "q=a", { q: "", page: undefined })).toBe("/menu");
  });
  it("nilai di daftar kosong ikut dihapus", () => {
    expect(buildUrl("/menu", "kategori=2&status=low", { kategori: "semua", status: "aktif" }, ["semua"])).toBe(
      "/menu?status=aktif",
    );
  });
});
