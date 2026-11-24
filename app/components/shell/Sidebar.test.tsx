// Test Sidebar penjual: jumlah grup dan tautan, badge, dan NavList hanya menerima prop sederhana.
// Modul Next.js dan server action dipalsukan (vi.mock) agar test tidak butuh server.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/menu", useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: vi.fn() }));
import { Sidebar } from "./Sidebar";
import { StoreStatusProvider } from "./StoreStatus";

const store = { isOpen: true, openTime: "07:00", closeTime: "16:00" };

describe("sidebar", () => {
  it("4 grup dan 11 tautan (termasuk Banner, Notifikasi); tautan aktif aria-current", () => {
    render(
      <StoreStatusProvider store={store}>
        <Sidebar store={store} badge={2} />
      </StoreStatusProvider>,
    );
    const nav = screen.getByRole("navigation", { name: "Menu utama" });
    expect(within(nav).getAllByRole("heading", { level: 2 })).toHaveLength(4);
    expect(within(nav).getAllByRole("link")).toHaveLength(11);
    const activeLink = within(nav).getByRole("link", { name: /Menu & Stok/ });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: /Pesanan/ })).not.toHaveAttribute("aria-current");
  });
  it("badge perlu tindakan di Dashboard", () => {
    render(
      <StoreStatusProvider store={store}>
        <Sidebar store={store} badge={2} />
      </StoreStatusProvider>,
    );
    expect(screen.getByText("2 perlu tindakan")).toBeInTheDocument();
  });
  it("badge notifikasi belum dibaca di Notifikasi; 0 → tanpa badge", () => {
    const { unmount } = render(
      <StoreStatusProvider store={store}>
        <Sidebar store={store} badge={0} unreadNotifications={3} />
      </StoreStatusProvider>,
    );
    expect(screen.getByRole("link", { name: /Notifikasi/ })).toHaveTextContent("3 belum dibaca");
    unmount();
    render(
      <StoreStatusProvider store={store}>
        <Sidebar store={store} badge={0} unreadNotifications={0} />
      </StoreStatusProvider>,
    );
    expect(screen.queryByText(/belum dibaca/)).not.toBeInTheDocument();
  });
});

describe("Sidebar -> NavList (batas server/klien)", () => {
  it("NavList hanya menerima prop yang dapat diserialisasi (tanpa fungsi/komponen)", () => {
    for (const admin of [false, true]) {
      const element = Sidebar({ store, badge: 1, admin });
      const foundProps: Record<string, unknown>[] = [];
      const walk = (node: unknown): void => {
        if (!node || typeof node !== "object") return;
        const { type, props } = node as {
          type?: { name?: string };
          props?: { children?: unknown } & Record<string, unknown>;
        };
        if (type?.name === "NavList" && props) foundProps.push(props);
        [props?.children].flat().forEach(walk);
      };
      walk(element);
      expect(foundProps).toHaveLength(1);
      for (const value of Object.values(foundProps[0]))
        expect(["string", "number", "boolean", "undefined"]).toContain(typeof value);
    }
  });
});
