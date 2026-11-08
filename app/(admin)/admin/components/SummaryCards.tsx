import Link from "next/link";
import { Banknote, CheckCircle2, ChevronRight, Hourglass, PauseCircle, Store, Timer, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Card } from "@/app/components/ui/Card";
import { fokus } from "@/app/components/ui/cx";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { labelAksi, labelTarget } from "@/services/adminLogService";
import type { Ringkasan, StatusPesananAdmin } from "@/types/admin";
import { formatJam, formatRupiah, formatTanggal } from "@/lib/format";
import { statusView, type TampilanStatus } from "@/lib/order-status";

const STATUS: [StatusPesananAdmin, TampilanStatus][] = [
  ["holding", "menunggu-konfirmasi"],
  ["confirmed", "confirmed"],
  ["cooking", "cooking"],
  ["ready", "ready"],
  ["completed", "completed"],
  ["cancelled", "cancelled"],
  ["expired", "expired"],
];

const PENJUAL: { key: keyof Ringkasan["merchants"]; label: string; href: string; icon: LucideIcon }[] = [
  { key: "pending", label: "Menunggu verifikasi", href: "/admin/verifikasi", icon: Hourglass },
  { key: "needs_fix", label: "Perlu perbaikan", href: "/admin/verifikasi", icon: Wrench },
  { key: "verified", label: "Aktif", href: "/admin/penjual?status=verified", icon: CheckCircle2 },
  { key: "suspended", label: "Ditangguhkan", href: "/admin/penjual?status=suspended", icon: PauseCircle },
  { key: "open_now", label: "Buka sekarang", href: "/admin/penjual?status=verified&open=1", icon: Store },
];

const tautan = `block rounded-lg ${fokus}`;

export function SummaryCards({ data }: { data: Ringkasan }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="Pesanan hari ini">
          <Card>
            <h2 className="text-lg font-semibold text-ink">Pesanan hari ini</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {STATUS.map(([key, tampil]) => {
                const v = statusView[tampil];
                return (
                  <li key={key} className="flex items-center justify-between gap-3">
                    <Badge tone={v.tone} icon={v.icon}>{v.label}</Badge>
                    <span className="font-mono text-lg font-semibold text-ink">{data.orders_today[key]}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
        <div className="flex flex-col gap-4">
          <KpiCard icon={Banknote} label="Omzet hari ini" value={formatRupiah(data.revenue_today)} hint="Pesanan selesai dari semua toko" />
          <KpiCard icon={Timer} label="Pesanan tertahan" value={data.holding_expiring_soon} hint="Segera kedaluwarsa, kurang dari 1 menit lagi" />
        </div>
      </div>

      <section aria-label="Penjual">
        <h2 className="mb-3 text-lg font-semibold text-ink">Penjual</h2>
        <ul className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          {PENJUAL.map(({ key, label, href, icon }) => (
            <li key={key}>
              <Link href={href} className={tautan}>
                <KpiCard icon={icon} label={label} value={data.merchants[key]} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Aksi admin terakhir">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Aksi admin terakhir</h2>
            <Link href="/admin/log" className={`inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary ${fokus}`}>
              Lihat semua log<ChevronRight aria-hidden className="size-4" />
            </Link>
          </div>
          {data.recent_logs.length === 0 ? (
            <p className="mt-3 text-ink-muted">Belum ada aksi admin.</p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-line">
              {data.recent_logs.map((l) => (
                <li key={l.id} className="py-2">
                  <p className="font-medium text-ink">{labelAksi(l.action)}</p>
                  <p className="text-sm text-ink-muted">{labelTarget(l.target_type, l.target_id)}</p>
                  <p className="text-sm text-ink-muted">{l.admin_name} · {formatTanggal(l.created_at)}, {formatJam(l.created_at)} WIB</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
