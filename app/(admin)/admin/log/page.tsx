import { Suspense } from "react";
import { AuditTable } from "@/app/(admin)/admin/components/AuditTable";
import { LogFilters } from "@/app/(admin)/admin/components/LogFilters";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { adminFetch } from "@/services/api";
import { LIMIT_LOG } from "@/services/adminLogService";
import type { AuditLog, MetaHalaman } from "@/types/admin";
import { requireAdmin } from "@/services/authService";

const FILTER = ["action", "target_type", "target_id", "from", "to"] as const;

// A-05 — Log aksi admin (hanya baca). Filter di URL.
export default async function LogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const k of FILTER) if (sp[k]) q.set(k, sp[k]!);
  const n = Number(sp.page);
  const page = Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 1;
  q.set("page", String(page));
  q.set("limit", String(LIMIT_LOG));
  const res = await adminFetch<AuditLog[]>(`/audit-logs?${q}`);
  const meta = res.meta as MetaHalaman | undefined;

  return (
    <PageHeader title="Log aksi admin" description="Setiap perubahan oleh admin tercatat di sini. Hanya untuk dibaca.">
      <Suspense>
        <LogFilters />
        {res.ok && res.data ? (
          <AuditTable rows={res.data} page={page} total={meta?.total ?? res.data.length} filtered={FILTER.some((k) => sp[k])} />
        ) : (
          <GagalMuat judul="Log belum bisa dimuat" isi="Terjadi kesalahan saat mengambil log. Periksa koneksi lalu coba lagi." />
        )}
      </Suspense>
    </PageHeader>
  );
}
