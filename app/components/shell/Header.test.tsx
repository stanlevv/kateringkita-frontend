// Test Header: kotak cari berupa form GET ke /pesanan dengan parameter q.
// Modul Next.js dan server action dipalsukan (vi.mock) agar test tidak butuh server.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: vi.fn() }));
import { Header } from "./Header";

describe("header", () => {
  it("cari: form GET ke /pesanan dengan param q (tanpa JS)", () => {
    render(<Header userName="Rohan" merchantName="Dapur" store={null} badge={0} />);
    const searchBox = screen.getByRole("searchbox", { name: "Cari kode pesanan atau nama pemesan" });
    expect(searchBox).toHaveAttribute("name", "q");
    const form = searchBox.closest("form")!;
    expect(form).toHaveAttribute("action", "/pesanan");
    expect(form.method).toBe("get");
  });
});
