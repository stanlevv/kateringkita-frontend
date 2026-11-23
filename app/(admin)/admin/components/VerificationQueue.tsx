// Komponen VerificationQueue: isi halaman /admin/verifikasi. Antrean verifikasi = penjual yang menunggu diperiksa admin
// (toko baru, atau toko yang sudah memperbaiki data setelah diminta). Tiap kartu berisi checklist dan tombol aksi admin
// (setujui/verifikasi, minta perbaikan, tangguhkan) dari AdminActionDialog. Server component: hanya menampilkan data.
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { isChecklistComplete, whatsappLink } from "@/services/admin-merchant.service";
import type { VerificationQueueItem } from "@/types/admin";
import { formatDate, formatPhone } from "@/lib/format";
import { AdminActionDialog } from "./AdminActionDialog";
import { Checklist } from "./Checklist";
import { VerificationStatus } from "./VerificationBadge";

/**
 * Antrean verifikasi, terlama dulu (urutan dari backend). Label "Diperbarui penjual" muncul bila penjual mengubah
 * tokonya setelah admin memberi catatan.
 * @param props.rows penjual di antrean
 * @returns daftar kartu penjual, atau EmptyState bila antrean kosong
 */
export function VerificationQueue({ rows }: { rows: VerificationQueueItem[] }) {
  if (rows.length === 0)
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Tidak ada penjual yang menunggu verifikasi"
        body="Penjual baru atau yang sudah memperbaiki tokonya akan muncul di sini."
      />
    );
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((merchant) => (
        <li key={merchant.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/admin/penjual/${merchant.id}`}
              className="text-lg font-semibold text-primary underline-offset-2 hover:underline"
            >
              {merchant.business_name}
            </Link>
            <span className="flex flex-wrap items-center gap-2">
              {merchant.updated_after_note && (
                <span className="rounded-md bg-info-bg px-2 py-1 text-sm font-medium text-info">
                  Diperbarui penjual
                </span>
              )}
              <VerificationStatus status={merchant.verification_status} />
            </span>
          </div>
          <p className="text-sm text-ink-muted">
            {merchant.owner_name} ·{" "}
            <a href={whatsappLink(merchant.wa_number)} target="_blank" rel="noopener noreferrer" className="underline">
              {formatPhone(merchant.wa_number)}
            </a>{" "}
            · Daftar {formatDate(merchant.created_at)}
          </p>
          {merchant.verification_note && <p className="text-sm">Catatan admin: {merchant.verification_note}</p>}
          <Checklist checklist={merchant.checklist} />
          <AdminActionDialog
            id={merchant.id}
            status={merchant.verification_status}
            checklistComplete={isChecklistComplete(merchant.checklist)}
          />
        </li>
      ))}
    </ul>
  );
}
