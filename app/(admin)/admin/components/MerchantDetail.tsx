import Link from "next/link";
import { isChecklistComplete, whatsappLink } from "@/services/admin-merchant.service";
import { listChanges, actionLabel } from "@/services/admin-log.service";
import type { AdminMerchantDetail } from "@/types/admin";
import { formatTime, formatDate, formatPhone } from "@/lib/format";
import { AdminActionDialog } from "./AdminActionDialog";
import { Checklist } from "./Checklist";
import { VerificationStatus } from "./VerificationStatus";

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:gap-4">
    <dt className="w-40 shrink-0 text-ink-muted">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
);
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4">
    <h2 className="mb-3 text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

/** A-05 — profil lengkap penjual, checklist, aksi sesuai status, dan log toko. */
export function MerchantDetail({ merchant }: { merchant: AdminMerchantDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <VerificationStatus status={merchant.verification_status} />
        <AdminActionDialog
          id={merchant.id}
          status={merchant.verification_status}
          checklistComplete={isChecklistComplete(merchant.checklist)}
        />
      </div>
      {merchant.verification_status === "needs_fix" && merchant.verification_note && (
        <p>Catatan admin: {merchant.verification_note}</p>
      )}
      {merchant.verification_status === "suspended" && merchant.suspended_reason && (
        <p>Alasan penangguhan: {merchant.suspended_reason}</p>
      )}

      <SectionCard title="Profil toko">
        <dl className="flex flex-col gap-2">
          <DetailRow label="Nama toko">{merchant.business_name}</DetailRow>
          <DetailRow label="Jenis usaha">{merchant.merchant_type_name}</DetailRow>
          <DetailRow label="Jumlah menu">{merchant.menu_count} menu aktif</DetailRow>
          <DetailRow label="Alamat">{merchant.address}</DetailRow>
          <DetailRow label="WhatsApp">
            <a href={whatsappLink(merchant.wa_number)} target="_blank" rel="noopener noreferrer" className="underline">
              {formatPhone(merchant.wa_number)}
            </a>
          </DetailRow>
          <DetailRow label="Jam buka">
            {merchant.open_time.slice(0, 5)} – {merchant.close_time.slice(0, 5)}
          </DetailRow>
          <DetailRow label="Dapur">{merchant.is_open ? "Buka" : "Tutup"}</DetailRow>
          <DetailRow label="Titik temu">
            {merchant.pickup_points.length ? merchant.pickup_points.map((point) => point.name).join(", ") : "Belum ada"}
          </DetailRow>
        </dl>
      </SectionCard>
      <SectionCard title="Pemilik">
        <dl className="flex flex-col gap-2">
          <DetailRow label="Nama">{merchant.owner.full_name}</DetailRow>
          <DetailRow label="Telepon">{formatPhone(merchant.owner.phone)}</DetailRow>
          <DetailRow label="Email">{merchant.owner.email ?? "—"}</DetailRow>
        </dl>
      </SectionCard>
      <SectionCard title="Checklist">
        <Checklist checklist={merchant.checklist} />
      </SectionCard>
      <SectionCard title="Log toko">
        {merchant.recent_logs.length === 0 ? (
          <p className="text-ink-muted">Belum ada aksi admin untuk toko ini.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {merchant.recent_logs.map((log) => (
              <li key={log.id} className="text-sm">
                <p className="font-medium">
                  {actionLabel(log.action)} · {log.admin_name}
                </p>
                <p className="text-ink-muted">
                  {formatDate(log.created_at)}, {formatTime(log.created_at)}
                  {log.reason ? ` · ${log.reason}` : ""}
                </p>
                {listChanges(log.before, log.after).map((change) => (
                  <p
                    key={change.field}
                    className="text-ink-muted"
                  >{`${change.field}: ${change.before} → ${change.after}`}</p>
                ))}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/admin/log?target_type=merchant&target_id=${merchant.id}`}
          className="mt-3 inline-flex min-h-11 items-center text-primary underline"
        >
          Lihat semua log toko ini
        </Link>
      </SectionCard>
    </div>
  );
}
