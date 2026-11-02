import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/admin/log", useSearchParams: () => new URLSearchParams("action=promo.update&page=3") }));
import { LogFilters } from "./LogFilters";

describe("filter log", () => {
  it("nilai awal dari URL; ubah target menaruhnya di URL dan membuang page", () => {
    render(<LogFilters />);
    expect(screen.getByLabelText("Aksi")).toHaveValue("promo.update");
    fireEvent.change(screen.getByLabelText("Jenis target"), { target: { value: "merchant" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/log?action=promo.update&target_type=merchant", { scroll: false });
  });
  it("tanggal dari/sampai masuk URL; mengosongkan aksi menghapusnya", () => {
    render(<LogFilters />);
    fireEvent.change(screen.getByLabelText("Dari tanggal"), { target: { value: "2026-10-01" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/log?action=promo.update&from=2026-10-01", { scroll: false });
    fireEvent.change(screen.getByLabelText("Sampai tanggal"), { target: { value: "2026-10-31" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/log?action=promo.update&to=2026-10-31", { scroll: false });
    fireEvent.change(screen.getByLabelText("Aksi"), { target: { value: "" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/log", { scroll: false });
  });
});
