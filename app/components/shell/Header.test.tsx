import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: vi.fn() }));
import { Header } from "./Header";

describe("SH-N2 header", () => {
  it("cari: form GET ke /pesanan dengan param q (tanpa JS)", () => {
    render(<Header nama="Rohan" toko="Dapur" store={null} badge={0} />);
    const kolom = screen.getByRole("searchbox", { name: "Cari kode pesanan atau nama pemesan" });
    expect(kolom).toHaveAttribute("name", "q");
    const form = kolom.closest("form")!;
    expect(form).toHaveAttribute("action", "/pesanan");
    expect(form.method).toBe("get");
  });
});
