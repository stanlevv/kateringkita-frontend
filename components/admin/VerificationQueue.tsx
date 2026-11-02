import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { checklistLengkap, linkWa } from "@/lib/admin/merchants";
import type { AntrianPenjual } from "@/lib/admin/types";
import { formatTanggal, formatTelepon } from "@/lib/format";
import { AdminActionDialog } from "./AdminActionDialog";
import { Checklist } from "./Checklist";
import { StatusVerifikasi } from "./StatusVerifikasi";

/** A-05 — antrean verifikasi, terlama dulu (urutan dari backend). */
export function VerificationQueue({ rows }: { rows: AntrianPenjual[] }) {
  if (rows.length === 0) return <EmptyState icon={ShieldCheck} title="Tidak ada penjual yang menunggu verifikasi" body="Penjual baru atau yang sudah memperbaiki tokonya akan muncul di sini." />;
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((m) => (
        <li key={m.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href={`/admin/penjual/${m.id}`} className="text-lg font-semibold text-primary underline-offset-2 hover:underline">{m.business_name}</Link>
            <span className="flex flex-wrap items-center gap-2">
              {m.updated_after_note && <span className="rounded-md bg-info-bg px-2 py-1 text-sm font-medium text-info">Diperbarui penjual</span>}
              <StatusVerifikasi status={m.verification_status} />
            </span>
          </div>
          <p className="text-sm text-ink-muted">
            {m.owner_name} ·{" "}
            <a href={linkWa(m.wa_number)} target="_blank" rel="noopener noreferrer" className="underline">{formatTelepon(m.wa_number)}</a>
            {" "}· Daftar {formatTanggal(m.created_at)}
          </p>
          {m.verification_note && <p className="text-sm">Catatan admin: {m.verification_note}</p>}
          <Checklist checklist={m.checklist} />
          <AdminActionDialog id={m.id} status={m.verification_status} lengkap={checklistLengkap(m.checklist)} />
        </li>
      ))}
    </ul>
  );
}
