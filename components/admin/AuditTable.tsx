"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ScrollText, SearchX } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pagination } from "@/components/ui/Pagination";
import { daftarPerubahan, labelAksi, LIMIT_LOG, labelTarget } from "@/lib/admin/log";
import type { AuditLog } from "@/lib/admin/types";
import { formatJam, formatTanggal } from "@/lib/format";
import { urlDengan } from "@/lib/url";

const KOLOM: Column<AuditLog>[] = [
  { key: "waktu", header: "Waktu (WIB)", cell: (l) => `${formatTanggal(l.created_at)}, ${formatJam(l.created_at)}` },
  { key: "admin", header: "Admin", cell: (l) => l.admin_name },
  { key: "aksi", header: "Aksi", cell: (l) => labelAksi(l.action) },
  { key: "target", header: "Target", cell: (l) => labelTarget(l.target_type, l.target_id) },
  { key: "alasan", header: "Alasan", wrap: true, cell: (l) => l.reason ?? "—" },
  {
    key: "perubahan",
    header: "Perubahan",
    wrap: true,
    cell: (l) => {
      const p = daftarPerubahan(l.before, l.after);
      if (p.length === 0) return "—";
      return (
        <ul>
          {p.map((x) => <li key={x.field}>{`${x.field}: ${x.lama} → ${x.baru}`}</li>)}
        </ul>
      );
    },
  },
];

export function AuditTable({ rows, page, total, filtered }: { rows: AuditLog[]; page: number; total: number; filtered: boolean }) {
  const path = usePathname();
  const params = useSearchParams();
  if (rows.length === 0) {
    if (page > 1) {
      return <EmptyState icon={SearchX} title="Halaman tidak ditemukan" body="Halaman ini melebihi jumlah data yang ada." action={<LinkButton href={urlDengan(path, params.toString(), { page: "" })} variant="secondary">Kembali ke halaman 1</LinkButton>} />;
    }
    return filtered ? (
      <EmptyState icon={SearchX} title="Tidak ada aksi yang cocok" body="Coba ubah atau hapus filter." action={<LinkButton href={path} variant="secondary">Hapus filter</LinkButton>} />
    ) : (
      <EmptyState icon={ScrollText} title="Belum ada aksi admin" body="Setiap aksi admin akan tercatat di sini." />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <DataTable caption="Log aksi admin" columns={KOLOM} rows={rows} rowKey={(l) => String(l.id)} />
      <Pagination page={page} total={total} limit={LIMIT_LOG} hrefFor={(p) => urlDengan(path, params.toString(), { page: String(p) }, ["1"])} />
    </div>
  );
}
