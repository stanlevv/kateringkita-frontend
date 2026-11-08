import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatWaLink } from "./galatAksi";

describe("M-04, M-11 ChatWaLink", () => {
  it("menuju route handler dengan kode ter-encode, tab baru, ≥ 44 px", () => {
    render(<ChatWaLink code="KK/1 ?#" />);
    const a = screen.getByRole("link", { name: /Chat WA/ });
    expect(a).toHaveAttribute("href", "/api/pesanan/KK%2F1%20%3F%23/wa");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    expect(a.className).toContain("min-h-11");
  });
});

describe("galatAksi CONFLICT", () => {
  it("memakai pesan dari server, fallback ke teks tetap", async () => {
    const { galatAksi } = await import("./galatAksi");
    expect(galatAksi("CONFLICT", "confirm", "Batas waktu pesanan sudah habis.")).toMatchObject({ jenis: "toast", message: "Batas waktu pesanan sudah habis.", muatUlang: true });
    expect(galatAksi("CONFLICT", "confirm")).toMatchObject({ message: "Pesanan sudah berubah status" });
    expect(galatAksi("INTERNAL_ERROR", "confirm", "Rahasia server")).toMatchObject({ message: "Gagal mengonfirmasi. Coba lagi." });
  });
});
