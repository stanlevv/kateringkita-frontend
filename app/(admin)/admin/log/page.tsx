import { Suspense } from "react";
import { AuditTable } from "@/app/(admin)/admin/components/AuditTable";
import { LogFilters } from "@/app/(admin)/admin/components/LogFilters";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { LIMIT_LOG } from "@/services/admin-log.service";
import type { AuditLog, PageMeta } from "@/types/admin";
import { requireAdmin } from "@/services/auth.service";

const FILTER_KEYS = ["action", "target_type", "target_id", "from", "to"] as const;

// A-05 — Log aksi admin (hanya baca). Filter di URL.
export default async function LogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const apiQuery = new URLSearchParams();
  for (const key of FILTER_KEYS) if (params[key]) apiQuery.set(key, params[key]!);
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100_000 ? pageParam : 1;
  apiQuery.set("page", String(page));
  apiQuery.set("limit", String(LIMIT_LOG));
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
