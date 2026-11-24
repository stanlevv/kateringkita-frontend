// Komponen AuditTable: tabel log aksi admin di /admin/log (siapa, kapan, aksi apa, terhadap apa, alasan, dan field
// yang berubah). Data diambil halaman /admin/log lalu dikirim lewat prop; label aksi dan target dari
// services/admin-log.service.ts.
// "use client": komponen ini berjalan di peramban (client component) karena membaca URL (usePathname dan
// useSearchParams) untuk tautan halaman.
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

// Kolom tabel log. Kolom Perubahan berisi daftar "field: lama → baru" dari before/after.
const COLUMNS: Column<AuditLog>[] = [
  {
    key: "waktu",
    header: "Waktu (WIB)",
    cell: (log) => `${formatDate(log.created_at)}, ${formatTime(log.created_at)}`,
  },
  { key: "admin", header: "Admin", cell: (log) => log.admin_name },
  { key: "aksi", header: "Aksi", cell: (log) => actionLabel(log.action) },
  { key: "target", header: "Target", cell: (log) => targetLabel(log.target_type, log.target_id) },
  { key: "alasan", header: "Alasan", wrap: true, cell: (log) => log.reason ?? "—" },
  {
    key: "perubahan",
    header: "Perubahan",
    wrap: true,
    cell: (log) => {
      const changes = listChanges(log.before, log.after);
      if (changes.length === 0) return "—";
      return (
        <ul>
          {changes.map((change) => (
            <li key={change.field}>{`${change.field}: ${change.before} → ${change.after}`}</li>
          ))}
        </ul>
      );
    },
  },
];

/**
 * Tabel log aksi admin dengan paginasi 20 baris. Bila kosong, pesannya membedakan halaman di luar jangkauan, hasil
 * filter kosong, dan belum ada log sama sekali.
 * @param props.rows log satu halaman
 * @param props.page nomor halaman sekarang
 * @param props.total jumlah semua log yang cocok
 * @param props.filtered true bila ada filter aktif di URL
 * @returns tabel dengan paginasi, atau EmptyState
 */
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
  // 1. URL sekarang, untuk tautan halaman yang mempertahankan filter.
  const path = usePathname();
  const params = useSearchParams();
  // 2. Kosong: halaman di luar jangkauan (tautan ke halaman 1), hasil filter kosong, atau belum ada log sama sekali.
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
      <DataTable caption="Log aksi admin" columns={COLUMNS} rows={rows} rowKey={(log) => String(log.id)} />
      <Pagination
        page={page}
        total={total}
        limit={LIMIT_LOG}
        hrefFor={(pageNumber) => buildUrl(path, params.toString(), { page: String(pageNumber) }, ["1"])}
      />
    </div>
  );
}
