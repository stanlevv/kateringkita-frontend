import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));
import { AccountMenu } from "./AccountMenu";

const pemicu = () => screen.getByRole("button", { name: /Rohan Rifqi/ });

describe("SH-N2 menu akun (disclosure)", () => {
  it("Keluar berupa form terpisah dari Pengaturan akun", async () => {
    render(<AccountMenu nama="Rohan Rifqi" toko="Dapur Barokah" />);
    expect(pemicu()).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(pemicu());
    expect(pemicu()).toHaveAttribute("aria-expanded", "true");
    const akun = screen.getByRole("link", { name: "Pengaturan akun" });
    expect(akun).toHaveAttribute("href", "/pengaturan#akun");
    expect(screen.getByRole("button", { name: "Keluar" }).closest("form")).not.toBeNull();
    expect(akun.closest("form")).toBeNull();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.queryByRole("menu")).toBeNull();
  });
  it("Esc menutup dan fokus kembali ke tombol", async () => {
    render(<AccountMenu nama="Rohan Rifqi" toko="Dapur Barokah" />);
    await userEvent.click(pemicu());
    await userEvent.tab();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: "Pengaturan akun" })).toBeNull();
    expect(pemicu()).toHaveFocus();
  });
  it("Tab keluar dari menu menutupnya", async () => {
    render(<AccountMenu nama="Rohan Rifqi" toko="Dapur Barokah" />);
    await userEvent.click(pemicu());
    await userEvent.tab(); // tautan
    await userEvent.tab(); // Keluar
    await userEvent.tab(); // keluar dari menu
    expect(screen.queryByRole("link", { name: "Pengaturan akun" })).toBeNull();
  });
});
