"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ScrollText, SearchX } from "lucide-react";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Pagination } from "@/app/components/ui/Pagination";
import { listChanges, actionLabel, LIMIT_LOG, targetLabel } from "@/services/admin-log.service";
import type { AuditLog } from "@/types/admin";
import { formatTime, formatDate } from "@/lib/format";
import { buildUrl } from "@/lib/url";

const KOLOM: Column<AuditLog>[] = [
  { key: "waktu", header: "Waktu (WIB)", cell: (l) => `${formatDate(l.created_at)}, ${formatTime(l.created_at)}` },
  { key: "admin", header: "Admin", cell: (l) => l.admin_name },
  { key: "aksi", header: "Aksi", cell: (l) => actionLabel(l.action) },
  { key: "target", header: "Target", cell: (l) => targetLabel(l.target_type, l.target_id) },
  { key: "alasan", header: "Alasan", wrap: true, cell: (l) => l.reason ?? "—" },
  {
    key: "perubahan",
    header: "Perubahan",
    wrap: true,
    cell: (l) => {
      const p = listChanges(l.before, l.after);
      if (p.length === 0) return "—";
      return (
        <ul>
          {p.map((x) => (
            <li key={x.field}>{`${x.field}: ${x.before} → ${x.after}`}</li>
          ))}
        </ul>
      );
    },
  },
];

export function AuditTable({
  rows,
  page,
  total,
  filtered,
}: {
  rows: AuditLog[];
  page: number;
  total: number;
  filtered: boolean;
}) {
  const path = usePathname();
  const params = useSearchParams();
  if (rows.length === 0) {
    if (page > 1) {
      return (
        <EmptyState
          icon={SearchX}
          title="Halaman tidak ditemukan"
          body="Halaman ini melebihi jumlah data yang ada."
          action={
            <LinkButton href={buildUrl(path, params.toString(), { page: "" })} variant="secondary">
              Kembali ke halaman 1
            </LinkButton>
          }
        />
      );
    }
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="Tidak ada aksi yang cocok"
        body="Coba ubah atau hapus filter."
        action={
          <LinkButton href={path} variant="secondary">
            Hapus filter
          </LinkButton>
        }
      />
    ) : (
      <EmptyState icon={ScrollText} title="Belum ada aksi admin" body="Setiap aksi admin akan tercatat di sini." />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <DataTable caption="Log aksi admin" columns={KOLOM} rows={rows} rowKey={(l) => String(l.id)} />
      <Pagination
        page={page}
        total={total}
        limit={LIMIT_LOG}
        hrefFor={(p) => buildUrl(path, params.toString(), { page: String(p) }, ["1"])}
      />
    </div>
  );
}
