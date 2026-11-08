import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/menu", useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/store", () => ({ setStoreOpen: vi.fn() }));
import { Sidebar } from "./Sidebar";
import { StoreStatusProvider } from "./StoreStatus";

const store = { isOpen: true, buka: "07:00", tutup: "16:00" };

describe("SH-N1 sidebar", () => {
  it("4 grup dan 9 tautan; tautan aktif aria-current", () => {
    render(<StoreStatusProvider store={store}><Sidebar store={store} badge={2} /></StoreStatusProvider>);
    const nav = screen.getByRole("navigation", { name: "Menu utama" });
    expect(within(nav).getAllByRole("heading", { level: 2 })).toHaveLength(4);
    expect(within(nav).getAllByRole("link")).toHaveLength(9);
    const aktif = within(nav).getByRole("link", { name: /Menu & Stok/ });
    expect(aktif).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: /Pesanan/ })).not.toHaveAttribute("aria-current");
  });
  it("badge perlu tindakan di Dashboard", () => {
    render(<StoreStatusProvider store={store}><Sidebar store={store} badge={2} /></StoreStatusProvider>);
    expect(screen.getByText("2 perlu tindakan")).toBeInTheDocument();
  });
});

describe("Sidebar -> NavList (batas server/klien)", () => {
  it("NavList hanya menerima prop yang dapat diserialisasi (tanpa fungsi/komponen)", () => {
    for (const admin of [false, true]) {
      const el = Sidebar({ store, badge: 1, admin });
      const ditemukan: Record<string, unknown>[] = [];
      const jelajah = (n: unknown): void => {
        if (!n || typeof n !== "object") return;
        const { type, props } = n as { type?: { name?: string }; props?: { children?: unknown } & Record<string, unknown> };
        if (type?.name === "NavList" && props) ditemukan.push(props);
        [props?.children].flat().forEach(jelajah);
      };
      jelajah(el);
      expect(ditemukan).toHaveLength(1);
      for (const nilai of Object.values(ditemukan[0])) expect(["string", "number", "boolean", "undefined"]).toContain(typeof nilai);
    }
  });
});
