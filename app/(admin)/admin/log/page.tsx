// Halaman /admin/log: log audit, yaitu catatan setiap perubahan yang dilakukan admin (siapa, kapan, aksi apa, pada data
// apa). Hanya untuk dibaca; tidak ada yang bisa diubah atau dihapus dari sini.
// Server component: membaca searchParams (?action=&target_type=&target_id=&from=&to=&page=), mengambil satu halaman
// log dari backend (GET /admin/audit-logs), lalu menampilkannya dengan LogFilters dan AuditTable. Semua tingkat admin.
import { Suspense } from "react";
import { AuditTable } from "@/app/(admin)/admin/components/AuditTable";
import { LogFilters } from "@/app/(admin)/admin/components/LogFilters";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { LIMIT_LOG } from "@/services/admin-log.service";
import type { AuditLog, PageMeta } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

// Parameter URL yang diteruskan apa adanya ke backend sebagai penyaring log.
const FILTER_KEYS = ["action", "target_type", "target_id", "from", "to"] as const;

/**
 * Halaman log aksi admin. Penyaring ada di URL agar bisa dibagikan. LogFilters dan AuditTable dibungkus Suspense karena
 * membaca useSearchParams di peramban.
 * @param props.searchParams parameter URL: penyaring di FILTER_KEYS dan `page`
 * @returns PageHeader berisi LogFilters dan AuditTable, atau LoadError bila log gagal dimuat
 */
export default async function LogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // 1. Pastikan admin (tingkat apa pun), lalu teruskan penyaring yang terisi.
  await requireAdmin();
  const params = await searchParams;
  const apiQuery = new URLSearchParams();
  for (const key of FILTER_KEYS) if (params[key]) apiQuery.set(key, params[key]!);
  // 2. Nomor halaman harus bilangan bulat 1–100.000; selain itu dianggap halaman 1.
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_LOG));
  // 3. Ambil satu halaman log; total untuk paginasi ada di `meta`.
  const response = await adminFetch<AuditLog[]>(`/audit-logs?${apiQuery}`);
  const meta = response.meta as PageMeta | undefined;

  return (
    <PageHeader title="Log aksi admin" description="Setiap perubahan oleh admin tercatat di sini. Hanya untuk dibaca.">
      <Suspense>
        <LogFilters />
        {response.ok && response.data ? (
          <AuditTable
            rows={response.data}
            page={page}
            total={meta?.total ?? response.data.length}
            filtered={FILTER_KEYS.some((key) => params[key])}
          />
        ) : (
          <LoadError
            title="Log belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil log. Periksa koneksi lalu coba lagi."
          />
        )}
      </Suspense>
    </PageHeader>
  );
}
