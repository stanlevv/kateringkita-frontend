import { describe, expect, it } from "vitest";
import { urlDengan } from "./url";

describe("urlDengan", () => {
  it("menambah, mengganti, dan menghapus parameter", () => {
    expect(urlDengan("/pesanan", "q=a&status=ready", { q: "b", page: "2", status: null })).toBe("/pesanan?q=b&page=2");
    expect(urlDengan("/pesanan", new URLSearchParams("q=a"), { tanggal: "2026-10-31" })).toBe("/pesanan?q=a&tanggal=2026-10-31");
  });
  it("semua kosong -> tanpa '?'", () => {
    expect(urlDengan("/menu", "q=a", { q: "", page: undefined })).toBe("/menu");
  });
  it("nilai di daftar kosong ikut dihapus", () => {
    expect(urlDengan("/menu", "kategori=2&status=low", { kategori: "semua", status: "aktif" }, ["semua"])).toBe("/menu?status=aktif");
  });
});
