// Test SectionError dan error.tsx per bagian: pesan galat tanpa detail teknis, tombol Coba lagi memanggil retry,
// tautan beranda sesuai bagian (admin ke /admin, penjual ke /dashboard).
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminError from "@/app/(admin)/admin/error";
import DashboardError from "@/app/(dashboard)/error";

const error = Object.assign(new Error("rahasia teknis"), { digest: "abc" });

describe("error.tsx per bagian", () => {
  it.each([
    ["admin", AdminError, "/admin", "Ke Dashboard admin"],
    ["penjual", DashboardError, "/dashboard", "Ke Dashboard"],
  ])("%s: pesan umum, Coba lagi memanggil retry, tautan ke beranda bagian", (_, Boundary, href, label) => {
    const retry = vi.fn();
    render(<Boundary error={error} retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Terjadi kesalahan");
    expect(screen.queryByText(/rahasia teknis/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
  });
});
