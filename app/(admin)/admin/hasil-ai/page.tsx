import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { requireAdmin } from "@/services/auth.service";
import type { AiResult } from "@/types/ai-result";
import { LIMIT_AI_RESULTS, parseAiResultTab } from "@/lib/ai-result";
import { AiResultList } from "./components/AiResultList";

// Rubrik AI: verifikasi manual hasil AI tersimpan. Semua tingkat admin melihat; super & ops menyetujui / menolak.
export default async function AiResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const tab = parseAiResultTab(params.status);
  const feature = params.fitur === "asisten" || params.fitur === "rekomendasi" ? params.fitur : "";
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  const apiQuery = new URLSearchParams();
  if (tab !== "semua") apiQuery.set("status", tab);
  if (feature) apiQuery.set("fitur", feature);
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_AI_RESULTS));
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
