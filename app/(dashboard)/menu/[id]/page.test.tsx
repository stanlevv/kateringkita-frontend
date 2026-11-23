import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/services/auth.service", () => ({ requireMerchant: async () => ({}) }));
const getMenu = vi.fn();
vi.mock("@/services/menu.service", () => ({ getMenu: (...args: unknown[]) => getMenu(...args) }));
vi.mock("@/services/meta.service", () => ({ getCategories: async () => ({ data: [] }) }));
vi.mock("@/app/(dashboard)/menu/components/MenuForm", () => ({ MenuForm: () => <p>FORM</p> }));
import EditMenuPage from "./page";

const renderPage = async (id: string) => render(await EditMenuPage({ params: Promise.resolve({ id }) }));

describe("MF-E5 /menu/[id]", () => {
  it("id bukan angka -> Menu tidak ditemukan dengan tautan ke katalog", async () => {
    await renderPage("abc");
    expect(screen.getByText("Menu tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali/ })).toHaveAttribute("href", "/menu");
    expect(getMenu).not.toHaveBeenCalled();
  });
  it("id tidak ada -> Menu tidak ditemukan", async () => {
    getMenu.mockResolvedValue({ error: { code: "NOT_FOUND", message: "x" } });
    await renderPage("999");
    expect(screen.getByText("Menu tidak ditemukan")).toBeInTheDocument();
  });
  it("gagal muat biasa -> GagalMuat, bukan tidak ditemukan", async () => {
    getMenu.mockResolvedValue({ error: { code: "INTERNAL_ERROR", message: "x" } });
    await renderPage("1");
    expect(screen.queryByText("Menu tidak ditemukan")).toBeNull();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
