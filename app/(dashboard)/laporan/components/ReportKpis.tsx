// Komponen ReportKpis: empat kartu KPI (indikator utama) di /laporan: omzet dan target, total HPP, laba bersih, dan
// pesanan selesai. Angkanya dihitung backend (GET /merchant/reports/summary); komponen ini hanya menampilkan.
// HPP = harga pokok penjualan, yaitu modal bahan.
import Link from "next/link";
import { CheckCircle2, Coins, PiggyBank, Target } from "lucide-react";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { focusRing } from "@/app/components/ui/cx";
import { formatRupiah } from "@/lib/format";
import type { ReportSummary } from "@/types/report";

/**
 * Baris KPI laporan. Bila target harian belum diisi, kartu omzet menampilkan tautan ke Pengaturan bagian Operasional.
 * Bilah capaian dijepit 100%, tetapi angka persennya boleh lebih dari 100.
 * @param props.summary ringkasan dari backend (omzet, target, achievement_pct, hpp_total, profit, orders)
 * @returns grid empat KpiCard
 */
export function ReportKpis({ summary }: { summary: ReportSummary }) {
  const { target, achievement_pct: achievementPct } = summary;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Omzet dan target" icon={Target} value={formatRupiah(summary.revenue)}>
        {target > 0 ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <div
                role="progressbar"
                aria-label="Capaian target"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(achievementPct, 100)}
                className="h-2 flex-1 overflow-hidden rounded-md bg-subtle"
              >
                <div className="h-full bg-primary" style={{ width: `${Math.min(achievementPct, 100)}%` }} />
              </div>
              <span className="font-mono text-sm font-semibold text-ink">{achievementPct}%</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">Target {formatRupiah(target)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">
            Target harian belum diisi.{" "}
            <Link
              href="/pengaturan#operasional"
              className={`inline-flex min-h-11 items-center rounded-md font-medium text-primary underline ${focusRing}`}
            >
              Atur target
            </Link>
          </p>
        )}
      </KpiCard>
      <KpiCard
        label="Total HPP"
        icon={Coins}
        value={formatRupiah(summary.hpp_total)}
        hint="Modal bahan untuk pesanan selesai"
      />
      <KpiCard label="Laba bersih" icon={PiggyBank} value={formatRupiah(summary.profit)} hint="Omzet dikurangi HPP" />
      <KpiCard label="Pesanan selesai" icon={CheckCircle2} value={summary.orders} />
    </div>
  );
}
