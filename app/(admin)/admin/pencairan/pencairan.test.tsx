import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const adminFetch = vi.fn();
const refresh = vi.fn();
const catatPencairan = vi.fn();
const tandaiRefund = vi.fn();
vi.mock("@/services/authService", () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }));
vi.mock("@/services/api", async (orig) => ({ ...(await orig<typeof import("@/services/api")>()), adminFetch: (...a: unknown[]) => adminFetch(...a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/pencairan", () => ({
  catatPencairan: (...a: unknown[]) => catatPencairan(...a),
  tandaiRefund: (...a: unknown[]) => tandaiRefund(...a),
}));
import { Toaster } from "@/app/components/ui/Toast";
import PencairanPage from "./page";

const AS_OF = "2026-11-10T03:00:00.000Z";
const rek = { bank: "bca", bank_name: "BCA", account_number: "012345678901", account_name: "Siti Aminah", updated_at: "2026-11-09T01:00:00.000Z" };
const SALDO = {
  as_of: AS_OF,
  rows: [
    { merchant_id: 1, business_name: "Dapur Siti", account: rek, amount: 58_000, orders: 3, since: "2026-11-08T03:00:00.000Z" },
    { merchant_id: 2, business_name: "Dapur Andi", account: null, amount: 15_000, orders: 1, since: "2026-11-09T03:00:00.000Z" },
  ],
};
const REFUND = [{
  code: "KK-20261110-AAAA", status: "cancelled", customer_name: "Budi", customer_phone: "081234567890", business_name: "Dapur Siti", dine_in: false,
  method: "online", amount: 30_000, paid_at: "2026-11-10T02:00:00.000Z", cancelled_at: "2026-11-10T02:10:00.000Z", cancelled_by: "merchant", cancel_reason: "Stok habis",
}];
const RIWAYAT = [{
  id: 7, merchant_id: 1, business_name: "Dapur Siti", amount: 120_000, orders_count: 6, bank: "bca", bank_name: "BCA", account_number: "012345678901",
  account_name: "Siti Aminah", reference: "TRF-0001", note: "Transfer pagi", admin_name: "Admin Uji", created_at: "2026-11-09T05:00:00.000Z",
}];

const balas = (data: unknown, meta?: unknown) => ({ ok: true, status: 200, data, ...(meta ? { meta } : {}) });
const tampil = async () => render(<><Toaster />{await PencairanPage({ searchParams: Promise.resolve({}) })}</>);

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ user: { full_name: "Dina", admin_level: "super" }, merchant: null });
  refresh.mockReset();
  catatPencairan.mockReset();
  tandaiRefund.mockReset();
  adminFetch.mockReset().mockImplementation(async (path: string) =>
    path === "/payouts/balances" ? balas(SALDO) : path === "/refunds" ? balas(REFUND) : balas(RIWAYAT, { page: 1, limit: 20, total: 1 }));
});

describe("/admin/pencairan (F26)", () => {
  it("hanya admin super; memuat saldo, refund, dan riwayat halaman 1", async () => {
    await tampil();
    expect(requireAdmin).toHaveBeenCalledWith("super");
    expect(adminFetch.mock.calls.map((c) => c[0]).sort()).toEqual(["/payouts/balances", "/payouts?page=1", "/refunds"]);
    const saldo = screen.getByRole("table", { name: "Saldo per toko" });
    expect(within(saldo).getByText("Rp 58.000")).toBeInTheDocument();
    expect(within(saldo).getByText("Rekening belum diisi")).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Dana yang harus dikembalikan" })).getByText("Dibatalkan penjual: Stok habis")).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Riwayat pencairan" })).getByText("TRF-0001")).toBeInTheDocument();
  });

  it("catat pencairan mengirim nominal & as_of yang tampil, lalu memuat ulang", async () => {
    catatPencairan.mockResolvedValue({ data: { ...RIWAYAT[0], id: 8, amount: 58_000 } });
    await tampil();
    await userEvent.click(within(screen.getByRole("table", { name: "Saldo per toko" })).getByRole("button", { name: "Catat pencairan" }));
    const dialog = screen.getByRole("dialog", { name: "Catat pencairan" });
    await userEvent.type(within(dialog).getByLabelText(/Nomor referensi transfer/), "TRF-0002");
    await userEvent.click(within(dialog).getByRole("button", { name: "Catat pencairan" }));
    expect(catatPencairan).toHaveBeenCalledWith({ merchant_id: 1, amount: 58_000, until: AS_OF, reference: "TRF-0002", note: "" });
    expect(await screen.findByText("Pencairan Rp 58.000 untuk Dapur Siti tercatat.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("saldo berubah (409) -> pesan backend dan muat ulang", async () => {
    catatPencairan.mockResolvedValue({ error: { code: "CONFLICT", message: "Saldo penjual berubah. Muat ulang lalu periksa lagi." } });
    await tampil();
    await userEvent.click(within(screen.getByRole("table", { name: "Saldo per toko" })).getByRole("button", { name: "Catat pencairan" }));
    const dialog = screen.getByRole("dialog", { name: "Catat pencairan" });
    await userEvent.type(within(dialog).getByLabelText(/Nomor referensi transfer/), "TRF-0002");
    await userEvent.click(within(dialog).getByRole("button", { name: "Catat pencairan" }));
    expect(await screen.findByText("Saldo penjual berubah. Muat ulang lalu periksa lagi.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("tandai dana dikembalikan dengan nomor referensi", async () => {
    tandaiRefund.mockResolvedValue({ data: { code: REFUND[0].code, amount: 30_000, reference: "RF-0001" } });
    await tampil();
    await userEvent.click(screen.getByRole("button", { name: "Tandai dikembalikan" }));
    const dialog = screen.getByRole("dialog", { name: "Tandai dana dikembalikan" });
    await userEvent.type(within(dialog).getByLabelText(/Nomor referensi pengembalian/), "RF-0001");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tandai dikembalikan" }));
    expect(tandaiRefund).toHaveBeenCalledWith(REFUND[0].code, "RF-0001");
    expect(await screen.findByText(`Pengembalian Rp 30.000 untuk ${REFUND[0].code} tercatat.`)).toBeInTheDocument();
  });

  it("kosong & gagal: pesan masing-masing bagian", async () => {
    adminFetch.mockImplementation(async (path: string) =>
      path === "/payouts/balances" ? balas({ as_of: AS_OF, rows: [] }) : path === "/refunds" ? balas([]) : { ok: false, status: 500, error: { code: "X", message: "x" } });
    await tampil();
    expect(screen.getByText("Tidak ada saldo")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada dana yang perlu dikembalikan")).toBeInTheDocument();
    expect(screen.getByText("Riwayat belum bisa dimuat")).toBeInTheDocument();
  });
});
