import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/app/actions/admin/hasilAi", () => ({ verifikasiHasilAi: vi.fn() }));
import type { AiResult } from "@/types/ai-result";
import { parseAiResultTab } from "@/lib/ai-result";
import { DaftarHasilAi } from "./DaftarHasilAi";

const H: AiResult = {
  id: 5,
  fitur: "asisten",
  input_text: "Harga risol?",
  status: "menunggu",
  catatan: null,
  output: { jawaban: "Rp 6.000", poin: [], asumsi: "" },
  created_at: "2026-11-16T05:00:00.000Z",
  verified_at: null,
  verified_by: null,
  user: { id: 2, name: "Siti" },
  merchant: { id: 1, business_name: "Dapur Siti" },
};

beforeEach(() => push.mockReset());

describe("DaftarHasilAi", () => {
  it("tabHasilAi: tanpa status = menunggu; nilai asing jadi menunggu", () => {
    expect(parseAiResultTab(undefined)).toBe("menunggu");
    expect(parseAiResultTab("ditolak")).toBe("ditolak");
    expect(parseAiResultTab("semua")).toBe("semua");
    expect(parseAiResultTab("hapus")).toBe("menunggu");
  });

  it("pindah tab & fitur memperbarui URL (halaman kembali ke 1)", () => {
    render(<DaftarHasilAi rows={[H]} tab="menunggu" fitur="" page={2} total={30} bolehUbah />);
    fireEvent.click(screen.getByRole("tab", { name: /Disetujui/ }));
    expect(push).toHaveBeenLastCalledWith("/admin/hasil-ai?status=disetujui");
    fireEvent.change(screen.getByLabelText("Fitur AI"), { target: { value: "rekomendasi" } });
    expect(push).toHaveBeenLastCalledWith("/admin/hasil-ai?fitur=rekomendasi");
    expect(screen.getByRole("navigation", { name: "Halaman" })).toBeInTheDocument();
  });

  it("kosong: pesan sesuai tab", () => {
    render(<DaftarHasilAi rows={[]} tab="menunggu" fitur="" page={1} total={0} bolehUbah />);
    expect(screen.getByText("Tidak ada hasil AI yang menunggu verifikasi")).toBeInTheDocument();
  });
});
