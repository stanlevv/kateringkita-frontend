import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryCards } from "./SummaryCards";
import type { Ringkasan } from "@/types/admin";

const data: Ringkasan = {
  orders_today: { holding: 2, confirmed: 1, cooking: 0, ready: 3, completed: 9, cancelled: 1, expired: 0 },
  revenue_today: 1250000,
  merchants: { pending: 4, needs_fix: 2, verified: 11, suspended: 1, open_now: 6 },
  holding_expiring_soon: 3,
  recent_logs: [
    { id: 9, admin_user_id: 1, admin_name: "Dina", action: "merchant.verify", target_type: "merchant", target_id: "5", reason: null, before: null, after: null, created_at: "2026-10-31T03:00:00.000Z" },
  ],
};

describe("kartu ringkasan", () => {
  it("menaut ke layar terkait", () => {
    render(<SummaryCards data={data} />);
    const href = (nama: RegExp) => screen.getByRole("link", { name: nama }).getAttribute("href");
    expect(href(/Menunggu verifikasi/)).toBe("/admin/verifikasi");
    expect(href(/Perlu perbaikan/)).toBe("/admin/verifikasi");
    expect(href(/Aktif/)).toBe("/admin/penjual?status=verified");
    expect(href(/Ditangguhkan/)).toBe("/admin/penjual?status=suspended");
    expect(href(/Buka sekarang/)).toBe("/admin/penjual?status=verified&open=1");
    expect(href(/Lihat semua log/)).toBe("/admin/log");
  });
  it("angka, omzet Rupiah, status pesanan berlabel, tertahan, dan log terakhir", () => {
    render(<SummaryCards data={data} />);
    expect(screen.getByText("Rp 1.250.000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Menunggu verifikasi/ })).toHaveTextContent("4");
    const pesanan = screen.getByRole("region", { name: "Pesanan hari ini" });
    expect(within(pesanan).getByText("Selesai").closest("li")).toHaveTextContent("9");
    expect(within(pesanan).getByText("Siap diambil").closest("li")).toHaveTextContent("3");
    expect(screen.getByText(/segera kedaluwarsa/i).parentElement).toHaveTextContent("3");
    expect(screen.getByText("Verifikasi penjual")).toBeInTheDocument();
    expect(screen.getByText(/Dina/)).toBeInTheDocument();
  });
  it("tanpa log: keterangan kosong", () => {
    render(<SummaryCards data={{ ...data, recent_logs: [] }} />);
    expect(screen.getByText("Belum ada aksi admin.")).toBeInTheDocument();
  });
});
