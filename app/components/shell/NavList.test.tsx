// Test NavList panel admin: menu aktif sesuai URL dan menu sesuai tingkat admin.
// Modul Next.js dan server action dipalsukan (vi.mock) agar test tidak butuh server.
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const currentPath = vi.hoisted(() => ({ path: "/admin/log" }));
vi.mock("next/navigation", () => ({ usePathname: () => currentPath.path }));
import { NavList } from "./NavList";

const activeLinks = () =>
  screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent);

beforeEach(() => {
  currentPath.path = "/admin/log";
});

describe("NavList admin", () => {
  it("di /admin/log hanya Log yang aktif; Ringkasan hanya cocok persis", () => {
    render(<NavList admin />);
    expect(activeLinks()).toEqual(["Log"]);
  });
  it("detail tiket menandai Tiket aktif; tingkat support melihat Tiket", () => {
    currentPath.path = "/admin/tiket/TK-20261113-7QPX";
    render(<NavList admin level="support" />);
    expect(activeLinks()).toEqual(["Tiket"]);
  });
});
