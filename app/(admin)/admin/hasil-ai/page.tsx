// Halaman /admin/hasil-ai: verifikasi hasil AI. Setiap jawaban asisten toko dan rekomendasi pembeli yang lolos validasi
// format disimpan backend; di sini admin memeriksanya dengan mata manusia lalu menyetujui atau menolak dengan alasan.
// Server component: membaca searchParams (?status=&fitur=&page=), mengambil satu halaman hasil AI dari backend
// (GET /admin/hasil-ai), lalu menyerahkannya ke AiResultList. Semua tingkat admin melihat; hanya super dan ops yang
// boleh memutuskan.
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { AiResult } from "@/types/ai-result";
import { LIMIT_AI_RESULTS, parseAiResultTab } from "@/lib/ai-result";
import { AiResultList } from "./components/AiResultList";

/**
 * Halaman verifikasi hasil AI.
 * @param props.searchParams parameter URL: `status` (menunggu, disetujui, ditolak, semua), `fitur` (asisten atau
 *   rekomendasi), `page`
 * @returns PageHeader berisi AiResultList, atau LoadError bila daftar gagal dimuat
 */
export default async function AiResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // 1. Pastikan admin (tingkatnya dipakai untuk menentukan siapa boleh memutuskan), lalu baca parameter URL.
  const session = await requireAdmin();
  const params = await searchParams;
  // 2. Saring nilai URL: tab tidak dikenal menjadi "menunggu", fitur selain dua nilai sah diabaikan.
  const tab = parseAiResultTab(params.status);
  const feature = params.fitur === "asisten" || params.fitur === "rekomendasi" ? params.fitur : "";
  // 3. Nomor halaman harus bilangan bulat 1–100.000; selain itu dianggap halaman 1.
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  // 4. Susun query ke backend; tab "semua" berarti tanpa penyaring status.
  const apiQuery = new URLSearchParams();
  if (tab !== "semua") apiQuery.set("status", tab);
  if (feature) apiQuery.set("fitur", feature);
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_AI_RESULTS));
  // 5. Ambil satu halaman; total untuk paginasi ada di `meta`.
  const response = await adminFetch<AiResult[]>(`/hasil-ai?${apiQuery}`);
  const total = (response.meta as { total?: number } | undefined)?.total ?? response.data?.length ?? 0;

  return (
    <PageHeader
      title="Verifikasi AI"
      description="Keluaran asisten toko dan rekomendasi pembeli yang sudah lolos validasi format. Periksa, lalu setujui atau tolak dengan alasan."
    >
      {response.ok && response.data ? (
        <AiResultList
          rows={response.data}
          tab={tab}
          feature={feature}
          page={page}
          total={total}
          canEdit={session.user.admin_level !== "support"}
        />
      ) : (
        <LoadError
          title="Hasil AI belum bisa dimuat"
          body="Terjadi kesalahan saat mengambil hasil AI. Periksa koneksi lalu coba lagi."
        />
      )}
    </PageHeader>
  );
}
