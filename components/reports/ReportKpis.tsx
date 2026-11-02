import Link from "next/link";
import { CheckCircle2, Coins, PiggyBank, Target } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { fokus } from "@/components/ui/cx";
import { formatRupiah } from "@/lib/format";
import type { ReportSummary } from "@/lib/types";

/** LP-N1, LP-A1, LP-S1. Target rentang = target harian x jumlah hari. */
export function ReportKpis({ summary, targetHarian, hari, selesai }: { summary: ReportSummary; targetHarian: number; hari: number; selesai: number }) {
  const target = targetHarian * hari;
  const pct = target > 0 ? Math.round((summary.revenue / target) * 100) : 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Omzet dan target" icon={Target} value={formatRupiah(summary.revenue)}>
        {target > 0 ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <div role="progressbar" aria-label="Capaian target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)} className="h-2 flex-1 overflow-hidden rounded-md bg-subtle">
                <div className="h-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <span className="font-mono text-sm font-semibold text-ink">{pct}%</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">Target {formatRupiah(target)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">
            Target harian belum diisi.{" "}
            <Link href="/pengaturan#operasional" className={`inline-flex min-h-11 items-center rounded-md font-medium text-primary underline ${fokus}`}>Atur target</Link>
          </p>
        )}
      </KpiCard>
      <KpiCard label="Total HPP" icon={Coins} value={formatRupiah(summary.hpp_total)} hint="Modal bahan untuk pesanan selesai" />
      <KpiCard label="Laba bersih" icon={PiggyBank} value={formatRupiah(summary.profit)} hint="Omzet dikurangi HPP" />
      <KpiCard label="Pesanan selesai" icon={CheckCircle2} value={selesai} />
    </div>
  );
}
