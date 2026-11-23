import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const verifyAiResult = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
  usePathname: () => "/admin/hasil-ai",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/actions/admin/ai-results", () => ({ verifyAiResult: (...a: unknown[]) => verifyAiResult(...a) }));
import { Toaster } from "@/app/components/ui/Toast";
import type { AiResult } from "@/types/ai-result";
import { KartuHasilAi } from "./AiResultCard";

const ASISTEN: AiResult = {
  id: 5,
  fitur: "asisten",
  input_text: "Harga risol untuk [nama]?",
  status: "menunggu",
  catatan: null,
  output: { jawaban: "Naikkan ke Rp 6.000.", poin: ["HPP Rp 2.500"], asumsi: "Harga bahan stabil" },
  created_at: "2026-11-16T05:00:00.000Z",
  verified_at: null,
  verified_by: null,
  user: { id: 2, name: "Siti" },
  merchant: { id: 1, business_name: "Dapur Siti" },
};
const REKOMENDASI: AiResult = {
  id: 6,
  fitur: "rekomendasi",
  input_text: "nasi goreng 2 porsi",
  status: "ditolak",
  catatan: "Melebihi anggaran",
  output: {
    summary: "Paket hemat.",
    total: 30000,
    items: [
      { menu_id: 1, menu: "Nasi Goreng Spesial", toko: "Dapur Siti", qty: 2, subtotal: 30000, reason: "Kenyang" },
    ],
  },
  created_at: "2026-11-16T05:00:00.000Z",
  verified_at: "2026-11-16T06:00:00.000Z",
  verified_by: { id: 9, name: "Admin Ops" },
  user: { id: 3, name: "Budi" },
  merchant: null,
};

beforeEach(() => {
  refresh.mockReset();
  verifyAiResult.mockReset().mockResolvedValue({ data: null });
});

describe("KartuHasilAi", () => {
  it("asisten toko: pengguna, toko, input tersamarkan, jawaban, poin, asumsi, status", () => {
    render(<KartuHasilAi h={ASISTEN} bolehUbah />);
    const k = within(screen.getByRole("article"));
    expect(k.getByText("Asisten toko")).toBeInTheDocument();
    expect(k.getByText(/Siti · Dapur Siti/)).toBeInTheDocument();
    expect(k.getByText("Harga risol untuk [nama]?")).toBeInTheDocument();
    expect(k.getByText("Naikkan ke Rp 6.000.")).toBeInTheDocument();
    expect(k.getByText("HPP Rp 2.500")).toBeInTheDocument();
    expect(k.getByText("Asumsi: Harga bahan stabil")).toBeInTheDocument();
    expect(k.getByText("Menunggu")).toBeInTheDocument();
  });

  it("rekomendasi pembeli: ringkasan, item, total; keputusan & catatan pemverifikasi", () => {
    render(<KartuHasilAi h={REKOMENDASI} bolehUbah />);
    const k = within(screen.getByRole("article"));
    expect(k.getByText("Rekomendasi pembeli")).toBeInTheDocument();
    expect(k.getByText("Paket hemat.")).toBeInTheDocument();
    expect(k.getByText(/2× Nasi Goreng Spesial · Dapur Siti/)).toBeInTheDocument();
    expect(k.getByText(/Kenyang/)).toBeInTheDocument();
    expect(k.getByText(/Total Rp\s?30\.000/)).toBeInTheDocument();
    expect(k.getByText("Ditolak")).toBeInTheDocument();
    expect(k.getByText(/oleh Admin Ops/)).toBeInTheDocument();
    expect(k.getByText(/Melebihi anggaran/)).toBeInTheDocument();
  });

  it("support: hanya melihat, tanpa tombol verifikasi", () => {
    render(<KartuHasilAi h={ASISTEN} bolehUbah={false} />);
    expect(screen.queryByRole("button", { name: "Setujui" })).not.toBeInTheDocument();
    expect(screen.getByText("Hanya admin Super atau Operasional yang bisa memverifikasi.")).toBeInTheDocument();
  });
});

describe("verifikasi", () => {
  it("setujui: aksi dipanggil, toast, data dimuat ulang", async () => {
    render(
      <>
        <Toaster />
        <KartuHasilAi h={ASISTEN} bolehUbah />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Setujui" }));
    expect(verifyAiResult).toHaveBeenCalledWith(5, "disetujui", "");
    expect(await screen.findByText("Hasil AI disetujui.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("tolak tanpa alasan: galat di kolom catatan, aksi tidak dipanggil; dengan alasan terkirim", async () => {
    render(
      <>
        <Toaster />
        <KartuHasilAi h={ASISTEN} bolehUbah />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tolak" }));
    expect(screen.getByText("Tulis alasan penolakan (3–300 karakter).")).toBeInTheDocument();
    expect(verifyAiResult).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Catatan verifikasi/), { target: { value: "Angka HPP salah" } });
    await userEvent.click(screen.getByRole("button", { name: "Tolak" }));
    expect(verifyAiResult).toHaveBeenCalledWith(5, "ditolak", "Angka HPP salah");
    expect(await screen.findByText("Hasil AI ditolak.")).toBeInTheDocument();
  });

  it("galat server tampil sebagai toast, tanpa muat ulang", async () => {
    verifyAiResult.mockResolvedValue({ error: { code: "NOT_FOUND", message: "Hasil AI tidak ditemukan." } });
    render(
      <>
        <Toaster />
        <KartuHasilAi h={ASISTEN} bolehUbah />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Setujui" }));
    expect(await screen.findByText("Hasil AI tidak ditemukan.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
