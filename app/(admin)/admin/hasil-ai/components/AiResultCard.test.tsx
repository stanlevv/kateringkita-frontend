// Test AiResultCard: isi kartu asisten toko dan rekomendasi pembeli, support hanya melihat, serta verifikasi
// (setujui, tolak wajib alasan, galat server). Server action verifyAiResult diganti tiruan (mock).
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
vi.mock("@/app/actions/admin/ai-results", () => ({ verifyAiResult: (...args: unknown[]) => verifyAiResult(...args) }));
import { Toaster } from "@/app/components/ui/Toast";
import type { AiResult } from "@/types/ai-result";
import { AiResultCard } from "./AiResultCard";

const ASSISTANT_RESULT: AiResult = {
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
const RECOMMENDATION_RESULT: AiResult = {
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

describe("AiResultCard", () => {
  it("asisten toko: pengguna, toko, input tersamarkan, jawaban, poin, asumsi, status", () => {
    render(<AiResultCard aiResult={ASSISTANT_RESULT} canEdit />);
    const card = within(screen.getByRole("article"));
    expect(card.getByText("Asisten toko")).toBeInTheDocument();
    expect(card.getByText(/Siti · Dapur Siti/)).toBeInTheDocument();
    expect(card.getByText("Harga risol untuk [nama]?")).toBeInTheDocument();
    expect(card.getByText("Naikkan ke Rp 6.000.")).toBeInTheDocument();
    expect(card.getByText("HPP Rp 2.500")).toBeInTheDocument();
    expect(card.getByText("Asumsi: Harga bahan stabil")).toBeInTheDocument();
    expect(card.getByText("Menunggu")).toBeInTheDocument();
  });

  it("rekomendasi pembeli: ringkasan, item, total; keputusan & catatan pemverifikasi", () => {
    render(<AiResultCard aiResult={RECOMMENDATION_RESULT} canEdit />);
    const card = within(screen.getByRole("article"));
    expect(card.getByText("Rekomendasi pembeli")).toBeInTheDocument();
    expect(card.getByText("Paket hemat.")).toBeInTheDocument();
    expect(card.getByText(/2× Nasi Goreng Spesial · Dapur Siti/)).toBeInTheDocument();
    expect(card.getByText(/Kenyang/)).toBeInTheDocument();
    expect(card.getByText(/Total Rp\s?30\.000/)).toBeInTheDocument();
    expect(card.getByText("Ditolak")).toBeInTheDocument();
    expect(card.getByText(/oleh Admin Ops/)).toBeInTheDocument();
    expect(card.getByText(/Melebihi anggaran/)).toBeInTheDocument();
  });

  it("support: hanya melihat, tanpa tombol verifikasi", () => {
    render(<AiResultCard aiResult={ASSISTANT_RESULT} canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Setujui" })).not.toBeInTheDocument();
    expect(screen.getByText("Hanya admin Super atau Operasional yang bisa memverifikasi.")).toBeInTheDocument();
  });
});

describe("verifikasi", () => {
  it("setujui: aksi dipanggil, toast, data dimuat ulang", async () => {
    render(
      <>
        <Toaster />
        <AiResultCard aiResult={ASSISTANT_RESULT} canEdit />
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
        <AiResultCard aiResult={ASSISTANT_RESULT} canEdit />
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
        <AiResultCard aiResult={ASSISTANT_RESULT} canEdit />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Setujui" }));
    expect(await screen.findByText("Hasil AI tidak ditemukan.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
