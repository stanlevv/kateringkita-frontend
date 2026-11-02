import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => "/admin/log", useSearchParams: () => new URLSearchParams("action=merchant.verify") }));
import { AuditTable } from "./AuditTable";
import type { AuditLog } from "@/lib/admin/types";

const log = (o: Partial<AuditLog>): AuditLog => ({
  id: 1, admin_user_id: 1, admin_name: "Dina", action: "merchant.suspend", target_type: "merchant", target_id: "7",
  reason: "Menu palsu", before: { verification_status: "verified" }, after: { verification_status: "suspended" },
  created_at: "2026-10-31T03:15:00.000Z", ...o,
});

describe("tabel log", () => {
  it("label aksi, waktu WIB, admin, target, alasan, dan daftar field: lama → baru", () => {
    render(<AuditTable rows={[log({}), log({ id: 2, action: "aksi.baru", reason: null, before: null, after: null })]} page={1} total={2} filtered={false} />);
    expect(screen.getByText("Tangguhkan penjual")).toBeInTheDocument();
    expect(screen.getByText("aksi.baru")).toBeInTheDocument();
    expect(screen.getAllByText(/31 Okt 2026.*10\.15/).length).toBe(2);
    expect(screen.getAllByText("Dina").length).toBe(2);
    expect(screen.getByText("Menu palsu")).toBeInTheDocument();
    expect(screen.getByText("Status verifikasi: Terverifikasi → Ditangguhkan")).toBeInTheDocument();
    expect(screen.getAllByText(/Penjual #7/).length).toBe(2);
  });
  it("kosong -> EmptyState", () => {
    render(<AuditTable rows={[]} page={1} total={0} filtered />);
    expect(screen.getByText("Tidak ada aksi yang cocok")).toBeInTheDocument();
    expect(render(<AuditTable rows={[]} page={1} total={0} filtered={false} />).getByText("Belum ada aksi admin")).toBeInTheDocument();
  });
  it("halaman di luar jangkauan: tautan kembali ke halaman 1 dengan filter tetap", () => {
    render(<AuditTable rows={[]} page={99} total={5} filtered={false} />);
    expect(screen.getByRole("link", { name: "Kembali ke halaman 1" }).getAttribute("href")).toBe("/admin/log?action=merchant.verify");
  });
  it("paginasi 20 per halaman mempertahankan filter di URL", () => {
    render(<AuditTable rows={[log({})]} page={1} total={45} filtered />);
    expect(screen.getByText("Halaman 1 dari 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Berikutnya/ }).getAttribute("href")).toBe("/admin/log?action=merchant.verify&page=2");
  });
});
