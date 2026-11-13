import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const lokasi = vi.hoisted(() => ({ path: "/admin/log" }));
vi.mock("next/navigation", () => ({ usePathname: () => lokasi.path }));
import { NavList } from "./NavList";

const aktif = () => screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.textContent);

beforeEach(() => { lokasi.path = "/admin/log"; });

describe("NavList admin", () => {
  it("di /admin/log hanya Log yang aktif; Ringkasan hanya cocok persis", () => {
    render(<NavList admin />);
    expect(aktif()).toEqual(["Log"]);
  });
  it("detail tiket menandai Tiket aktif; tingkat support melihat Tiket", () => {
    lokasi.path = "/admin/tiket/TK-20261113-7QPX";
    render(<NavList admin level="support" />);
    expect(aktif()).toEqual(["Tiket"]);
  });
});
