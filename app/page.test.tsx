import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

let down = false;
const getSession = vi.fn();
vi.mock("@/services/authService", () => ({ getSession: () => (down ? Promise.reject(new Error("down")) : getSession()) }));

// jsdom tidak punya IntersectionObserver/matchMedia; animasi landing cukup dibuat diam.
vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
vi.stubGlobal("matchMedia", () => ({ matches: true }));

beforeEach(() => { getSession.mockReset(); down = false; });

describe("landing", () => {
  it("LD-N1/N2 pengunjung: Masuk + Daftar sebagai penjual", async () => {
    getSession.mockResolvedValue(null);
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Masuk" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: /Daftar/ })[0]).toHaveAttribute("href", "/register");
  });

  it("LD-A1 sudah login: Buka dashboard", async () => {
    getSession.mockResolvedValue({ user: { role: "merchant" }, merchant: {} });
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Buka dashboard" })[0]).toHaveAttribute("href", "/dashboard");
  });

  it("admin: tombol Ke panel admin -> /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "admin" }, merchant: null });
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Ke panel admin" })[0]).toHaveAttribute("href", "/admin");
    expect(screen.queryByRole("link", { name: "Buka dashboard" })).toBeNull();
  });

  it("backend mati -> header pengunjung", async () => {
    down = true;
    render(await Home());
    expect(screen.getAllByRole("link", { name: "Masuk" }).length).toBeGreaterThan(0);
  });

  it("LD-S1 tanpa klaim palsu", async () => {
    getSession.mockResolvedValue(null);
    const { container } = render(await Home());
    expect(container.textContent).not.toMatch(/Redis|RAG|Lab|WebSocket/);
    expect(container.textContent).not.toMatch(/gratis/i);
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBe(3);
  });
});
