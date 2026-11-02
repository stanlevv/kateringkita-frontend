import Link from "next/link";
import { checklistLengkap, linkWa } from "@/lib/admin/merchants";
import { daftarPerubahan, labelAksi } from "@/lib/admin/log";
import type { DetailPenjual } from "@/lib/admin/types";
import { formatJam, formatTanggal, formatTelepon } from "@/lib/format";
import { AdminActionDialog } from "./AdminActionDialog";
import { Checklist } from "./Checklist";
import { StatusVerifikasi } from "./StatusVerifikasi";

const Baris = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:gap-4"><dt className="w-40 shrink-0 text-ink-muted">{k}</dt><dd className="min-w-0 break-words">{children}</dd></div>
);
const Kartu = ({ judul, children }: { judul: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-line bg-surface p-4"><h2 className="mb-3 text-lg font-semibold">{judul}</h2>{children}</section>
);

/** A-05 — profil lengkap penjual, checklist, aksi sesuai status, dan log toko. */
export function MerchantDetail({ m }: { m: DetailPenjual }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusVerifikasi status={m.verification_status} />
        <AdminActionDialog id={m.id} status={m.verification_status} lengkap={checklistLengkap(m.checklist)} />
      </div>
      {m.verification_status === "needs_fix" && m.verification_note && <p>Catatan admin: {m.verification_note}</p>}
      {m.verification_status === "suspended" && m.suspended_reason && <p>Alasan penangguhan: {m.suspended_reason}</p>}

      <Kartu judul="Profil toko">
        <dl className="flex flex-col gap-2">
          <Baris k="Nama toko">{m.business_name}</Baris>
          <Baris k="Jenis usaha">{m.merchant_type_name}</Baris>
          <Baris k="Jumlah menu">{m.menu_count} menu aktif</Baris>
          <Baris k="Alamat">{m.address}</Baris>
          <Baris k="WhatsApp"><a href={linkWa(m.wa_number)} target="_blank" rel="noopener noreferrer" className="underline">{formatTelepon(m.wa_number)}</a></Baris>
          <Baris k="Jam buka">{m.open_time.slice(0, 5)} – {m.close_time.slice(0, 5)}</Baris>
          <Baris k="Dapur">{m.is_open ? "Buka" : "Tutup"}</Baris>
          <Baris k="Titik temu">{m.pickup_points.length ? m.pickup_points.map((p) => p.name).join(", ") : "Belum ada"}</Baris>
        </dl>
      </Kartu>
      <Kartu judul="Pemilik">
        <dl className="flex flex-col gap-2">
          <Baris k="Nama">{m.owner.full_name}</Baris>
          <Baris k="Telepon">{formatTelepon(m.owner.phone)}</Baris>
          <Baris k="Email">{m.owner.email ?? "—"}</Baris>
        </dl>
      </Kartu>
      <Kartu judul="Checklist"><Checklist checklist={m.checklist} /></Kartu>
      <Kartu judul="Log toko">
        {m.recent_logs.length === 0 ? <p className="text-ink-muted">Belum ada aksi admin untuk toko ini.</p> : (
          <ul className="flex flex-col gap-3">
            {m.recent_logs.map((l) => (
              <li key={l.id} className="text-sm">
                <p className="font-medium">{labelAksi(l.action)} · {l.admin_name}</p>
                <p className="text-ink-muted">{formatTanggal(l.created_at)}, {formatJam(l.created_at)}{l.reason ? ` · ${l.reason}` : ""}</p>
                {daftarPerubahan(l.before, l.after).map((p) => <p key={p.field} className="text-ink-muted">{`${p.field}: ${p.lama} → ${p.baru}`}</p>)}
              </li>
            ))}
          </ul>
        )}
        <Link href={`/admin/log?target_type=merchant&target_id=${m.id}`} className="mt-3 inline-flex min-h-11 items-center text-primary underline">Lihat semua log toko ini</Link>
      </Kartu>
    </div>
  );
}
