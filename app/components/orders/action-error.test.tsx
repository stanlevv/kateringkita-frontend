import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatWaLink } from "./action-error";

describe("M-04, M-11 ChatWaLink", () => {
  it("menuju route handler dengan kode ter-encode, tab baru, ≥ 44 px", () => {
    render(<ChatWaLink code="KK/1 ?#" />);
    const link = screen.getByRole("link", { name: /Chat WA/ });
    expect(link).toHaveAttribute("href", "/api/pesanan/KK%2F1%20%3F%23/wa");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.className).toContain("min-h-11");
  });
});

describe("galatAksi CONFLICT", () => {
  it("memakai pesan dari server, fallback ke teks tetap", async () => {
    const { actionErrorView } = await import("./action-error");
    expect(actionErrorView("CONFLICT", "confirm", "Batas waktu pesanan sudah habis.")).toMatchObject({
      kind: "toast",
      message: "Batas waktu pesanan sudah habis.",
      reload: true,
    });
    expect(actionErrorView("CONFLICT", "confirm")).toMatchObject({ message: "Pesanan sudah berubah status" });
    expect(actionErrorView("INTERNAL_ERROR", "confirm", "Rahasia server")).toMatchObject({
      message: "Gagal mengonfirmasi. Coba lagi.",
    });
  });
});
