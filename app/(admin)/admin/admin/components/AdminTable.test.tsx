import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const setAdminActive = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/app/actions/admin/accounts", () => ({
  createAdmin: vi.fn(),
  resetAdminPassword: vi.fn(),
  updateAdminLevel: vi.fn(),
  setAdminActive: (...args: unknown[]) => setAdminActive(...args),
}));
import type { AdminAccount } from "@/types/admin";
import { AdminTable } from "./AdminTable";

const inactiveAdmin: AdminAccount = {
  id: 5,
  full_name: "Rina",
  phone: "081211112222",
  email: null,
  admin_level: "ops",
  is_active: false,
  must_change_password: false,
  created_at: "2026-11-01T03:00:00.000Z",
  last_login_at: null,
};

beforeEach(() => {
  refresh.mockReset();
  setAdminActive.mockReset().mockResolvedValue({ data: { ...inactiveAdmin, is_active: true } });
});

// Mengaktifkan lagi admin nonaktif (sandi lama ikut aktif) tidak boleh jalan dengan sekali klik
describe("AdminTable", () => {
  it("Aktifkan meminta konfirmasi dulu", async () => {
    render(<AdminTable rows={[inactiveAdmin]} currentAdminId={1} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan Rina" }));
    expect(setAdminActive).not.toHaveBeenCalled();
    const dialog = within(screen.getByRole("dialog", { name: "Aktifkan admin?" }));
    await userEvent.click(dialog.getByRole("button", { name: "Ya, aktifkan" }));
    expect(setAdminActive).toHaveBeenCalledWith(5, true);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
