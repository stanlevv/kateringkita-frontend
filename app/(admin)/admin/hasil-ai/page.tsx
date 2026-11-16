import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/authService";
import type { HasilAi } from "@/types/hasil-ai";
import { DaftarHasilAi, LIMIT_HASIL_AI, tabHasilAi } from "./components/DaftarHasilAi";

// Rubrik AI: verifikasi manual hasil AI tersimpan. Semua tingkat admin melihat; super & ops menyetujui / menolak.
export default async function HasilAiPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const tab = tabHasilAi(sp.status);
  const fitur = sp.fitur === "asisten" || sp.fitur === "rekomendasi" ? sp.fitur : "";
  const n = Number(sp.page);
  const page = Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
  const q = new URLSearchParams();
  if (tab !== "semua") q.set("status", tab);
  if (fitur) q.set("fitur", fitur);
  q.set("page", String(page));
  q.set("limit", String(LIMIT_HASIL_AI));
  const res = await adminFetch<HasilAi[]>(`/hasil-ai?${q}`);
  const total = (res.meta as { total?: number } | undefined)?.total ?? res.data?.length ?? 0;

  return (
    <PageHeader
      title="Verifikasi AI"
      description="Keluaran asisten toko dan rekomendasi pembeli yang sudah lolos validasi format. Periksa, lalu setujui atau tolak dengan alasan."
    >
      {res.ok && res.data ? (
        <DaftarHasilAi rows={res.data} tab={tab} fitur={fitur} page={page} total={total} bolehUbah={session.user.admin_level !== "support"} />
      ) : (
        <GagalMuat judul="Hasil AI belum bisa dimuat" isi="Terjadi kesalahan saat mengambil hasil AI. Periksa koneksi lalu coba lagi." />
      )}
    </PageHeader>
  );
}
