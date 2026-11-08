import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/log" }));
import { NavList } from "./NavList";

describe("NavList admin", () => {
  it("di /admin/log hanya Log yang aktif; Ringkasan hanya cocok persis", () => {
    render(<NavList admin />);
    const aktif = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(aktif.map((a) => a.textContent)).toEqual(["Log"]);
  });
});
