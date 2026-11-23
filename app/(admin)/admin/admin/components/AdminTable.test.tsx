import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const setAktifAdmin = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/app/actions/admin/akun", () => ({
  buatAdmin: vi.fn(),
  resetSandiAdmin: vi.fn(),
  ubahLevelAdmin: vi.fn(),
  setAktifAdmin: (...a: unknown[]) => setAktifAdmin(...a),
}));
import type { AkunAdmin } from "@/types/admin";
import { AdminTable } from "./AdminTable";

const nonaktif: AkunAdmin = {
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
  setAktifAdmin.mockReset().mockResolvedValue({ data: { ...nonaktif, is_active: true } });
});

// AUD-35: mengaktifkan lagi admin nonaktif (sandi lama ikut aktif) tidak boleh jalan dengan sekali klik
describe("AdminTable", () => {
  it("Aktifkan meminta konfirmasi dulu", async () => {
    render(<AdminTable rows={[nonaktif]} sayaId={1} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan Rina" }));
    expect(setAktifAdmin).not.toHaveBeenCalled();
    const dlg = within(screen.getByRole("dialog", { name: "Aktifkan admin?" }));
    await userEvent.click(dlg.getByRole("button", { name: "Ya, aktifkan" }));
    expect(setAktifAdmin).toHaveBeenCalledWith(5, true);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
