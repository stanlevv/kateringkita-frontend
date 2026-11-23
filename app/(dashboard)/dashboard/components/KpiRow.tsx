// Komponen KpiRow: empat angka ringkasan hari ini di atas antrean dashboard. Dipakai DashboardLive.
// KPI = key performance indicator, angka utama yang dipantau penjual.
import { ClipboardList, Gauge, Timer, Wallet } from "lucide-react";
import { KpiCard } from "@/app/components/ui/KpiCard";
import type { TodaySummary } from "@/lib/dashboard";
import { formatRupiah } from "@/lib/format";

/**
 * Empat KPI hari ini: omzet, kapasitas terpakai, perlu tindakan, dan rata-rata waktu siap. Angkanya dihitung
 * summarizeToday dari data yang sama dengan kartu antrean dan panel kuota, jadi selalu cocok.
 * @param props.summary ringkasan hari ini
 * @returns elemen `section`
 */
export function KpiRow({ summary }: { summary: TodaySummary }) {
  const { used, total } = summary.capacity;
  const usedRatio = total ? Math.min(1, used / total) : 0;
  return (
    <section aria-label="Ringkasan hari ini" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <KpiCard
        label="Omzet hari ini"
        icon={Wallet}
        value={formatRupiah(summary.revenue)}
        hint="dari pesanan selesai hari ini"
      />
      <KpiCard
        label="Kapasitas terpakai"
        icon={Gauge}
        value={
          <>
            {used}/{total} <span className="text-base font-normal text-ink-muted">porsi</span>
          </>
        }
      >
        <div
          role="progressbar"
          aria-label="Kapasitas terpakai"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(usedRatio * 100)}
          className="mt-2 h-2 overflow-hidden rounded-sm bg-subtle"
        >
          <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${usedRatio})` }} />
        </div>
      </KpiCard>
      <KpiCard label="Perlu tindakan" icon={ClipboardList} value={summary.needsAction} hint="pesanan menunggu Anda" />
      <KpiCard
        label="Rata-rata siap"
        icon={Timer}
        value={summary.averageReadyMinutes === null ? "—" : `${summary.averageReadyMinutes} menit`}
        hint={summary.averageReadyMinutes === null ? "belum ada pesanan siap hari ini" : "dari konfirmasi sampai siap"}
      />
    </section>
  );
}
