// Test CollapsibleSidebar dan rail Sidebar: mode dari cookie kk-sidebar, tombol ciutkan/lebarkan, drawer rail.
// Modul Next.js dan server action dipalsukan (vi.mock) agar test tidak butuh server.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/menu", useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: vi.fn() }));
import { Sidebar } from "./Sidebar";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

const aside = (container: HTMLElement) => container.querySelector("aside")!;

describe("sidebar bisa diciutkan/dilebarkan", () => {
  afterEach(() => {
    document.cookie = "kk-sidebar=; path=/; max-age=0";
  });

  it("mulai dari mode cookie; tombol mengganti mode dan menyimpannya di cookie", () => {
    const { container } = render(
      <CollapsibleSidebar mode="lebar" topContent={null}>
        isi
      </CollapsibleSidebar>,
    );
    expect(aside(container)).toHaveAttribute("data-sidebar", "lebar");

    fireEvent.click(screen.getByRole("button", { name: "Ciutkan menu" }));
    expect(aside(container)).toHaveAttribute("data-sidebar", "ringkas");
    expect(document.cookie).toContain("kk-sidebar=ringkas");

    fireEvent.click(screen.getByRole("button", { name: "Lebarkan menu" }));
    expect(aside(container)).toHaveAttribute("data-sidebar", "lebar");
    expect(document.cookie).toContain("kk-sidebar=lebar");
  });

  it("mode ringkas dari server langsung dirender ringkas (tanpa kedip)", () => {
    const { container } = render(
      <CollapsibleSidebar mode="ringkas" topContent={null}>
        isi
      </CollapsibleSidebar>,
    );
    expect(aside(container)).toHaveAttribute("data-sidebar", "ringkas");
  });

  it("rail tablet: tombol 'Lebarkan menu' membuka drawer berisi menu berlabel lengkap", () => {
    render(<Sidebar admin store={null} badge={0} mode="ringkas" />);
    // Dua tombol: pembuka drawer (768–1279 px) dan pelebar permanen (≥ 1280 px); CSS memilih satu per lebar layar.
    fireEvent.click(screen.getAllByRole("button", { name: "Lebarkan menu" })[0]);
    const drawer = screen.getByRole("dialog", { name: "Menu" });
    expect(within(drawer).getByRole("link", { name: "Log" })).toBeVisible();
  });
});
