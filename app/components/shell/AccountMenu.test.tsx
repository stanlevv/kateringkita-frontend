// Test AccountMenu: tautan akun terpisah dari form Keluar, Esc dan Tab keluar menutup panel.
// Modul Next.js dan server action dipalsukan (vi.mock) agar test tidak butuh server.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));
import { AccountMenu } from "./AccountMenu";

const trigger = () => screen.getByRole("button", { name: /Rohan Rifqi/ });

describe("menu akun (disclosure)", () => {
  it("Keluar berupa form terpisah dari Pengaturan akun", async () => {
    render(<AccountMenu userName="Rohan Rifqi" merchantName="Dapur Barokah" />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    const accountLink = screen.getByRole("link", { name: "Pengaturan akun" });
    expect(accountLink).toHaveAttribute("href", "/pengaturan#akun");
    expect(screen.getByRole("button", { name: "Keluar" }).closest("form")).not.toBeNull();
    expect(accountLink.closest("form")).toBeNull();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.queryByRole("menu")).toBeNull();
  });
  it("Esc menutup dan fokus kembali ke tombol", async () => {
    render(<AccountMenu userName="Rohan Rifqi" merchantName="Dapur Barokah" />);
    await userEvent.click(trigger());
    await userEvent.tab();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: "Pengaturan akun" })).toBeNull();
    expect(trigger()).toHaveFocus();
  });
  it("Tab keluar dari menu menutupnya", async () => {
    render(<AccountMenu userName="Rohan Rifqi" merchantName="Dapur Barokah" />);
    await userEvent.click(trigger());
    await userEvent.tab(); // tautan
    await userEvent.tab(); // Keluar
    await userEvent.tab(); // keluar dari menu
    expect(screen.queryByRole("link", { name: "Pengaturan akun" })).toBeNull();
  });
});
