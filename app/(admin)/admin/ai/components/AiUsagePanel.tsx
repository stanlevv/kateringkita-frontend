import Link from "next/link";
import { Activity, CircleX, Coins, Timer } from "lucide-react";
import { BarChart } from "@/app/components/ui/BarChart";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { cx, focusRing } from "@/app/components/ui/cx";
import { formatTime, formatDate } from "@/lib/format";
import type { AiFeature, AiUsage } from "@/types/ai";

export const AI_USAGE_RANGES = [7, 30] as const;
const FEATURE_LABELS: Record<AiFeature, string> = {
  asisten: "Asisten toko",
  rekomendasi: "Rekomendasi pembeli",
  uji: "Uji koneksi",
};
const formatNumber = (value: number) => value.toLocaleString("id-ID");
const percent = (part: number, whole: number) => `${whole ? Math.round((part / whole) * 100) : 0}%`;
const formatMs = (value: number | null) => (value === null ? "-" : `${formatNumber(value)} ms`);
const shortDate = (date: string) => formatDate(`${date}T12:00:00+07:00`).replace(/ \d{4}$/, "");
const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`;
const headerCellClass = "px-3 py-2 font-medium";
const bodyCellClass = "px-3 py-2";

function UsageTable({ title, columns, children }: { title: string; columns: string[]; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-subtle text-ink-muted">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className={headerCellClass}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

// F25: pemakaian AI (semua fitur) — panggilan, gagal, token, latensi; per hari, per penyedia, per fitur, gagal terakhir
export function AiUsagePanel({ data }: { data: AiUsage }) {
  const summary = data.ringkas;
  const dayCount = data.per_hari.length;
  return (
    <section aria-labelledby="judul-pemakaian" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="judul-pemakaian" className="font-display text-lg font-semibold">
          Pemakaian
        </h2>
        <nav aria-label="Rentang pemakaian" className="inline-flex gap-1 rounded-md border border-line-strong p-1">
          {AI_USAGE_RANGES.map((range) => (
            <Link
              key={range}
              href={`/admin/ai?hari=${range}`}
              aria-current={range === data.hari ? "page" : undefined}
              className={cx(
                "rounded px-3 py-1.5 text-sm font-medium",
                range === data.hari ? "bg-steel text-on-steel" : "text-ink-muted hover:text-ink",
                focusRing,
              )}
            >
              {range} hari
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Panggilan · ${data.hari} hari`}
          value={formatNumber(summary.panggilan)}
          icon={Activity}
          hint="Termasuk percobaan ke penyedia berikutnya"
        />
        <KpiCard
          label="Gagal"
          value={formatNumber(summary.gagal)}
          icon={CircleX}
          hint={`${percent(summary.gagal, summary.panggilan)} dari panggilan`}
        />
        <KpiCard
          label="Token"
          value={formatNumber(summary.token)}
          icon={Coins}
          hint={`Masuk ${formatNumber(summary.token_masuk)} · keluar ${formatNumber(summary.token_keluar)}`}
        />
        <KpiCard
          label="Rata-rata respons"
          value={formatMs(summary.rata_ms)}
          icon={Timer}
          hint="Dari panggilan yang berhasil"
        />
      </div>

      <BarChart
        title="Token per hari"
        description={`${data.hari} hari terakhir, tanggal WIB. Angka sesuai laporan penyedia.`}
        series={[{ key: "token", name: "Token", shortName: "token", color: "var(--color-primary)" }]}
        data={data.per_hari.map((day) => ({ label: shortDate(day.tanggal), values: { token: day.token } }))}
        axisTicks={dayCount <= 7 ? data.per_hari.map((_, i) => i) : [0, 7, 14, 21, dayCount - 1]}
        columnLabel="Tanggal"
        empty={
          <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">
            {summary.panggilan
              ? "Penyedia tidak melaporkan token di rentang ini."
              : "Belum ada pemakaian AI di rentang ini."}
          </p>
        }
      />

      {data.per_penyedia.length > 0 && (
        <>
          <UsageTable
            title="Per penyedia"
            columns={["Penyedia", "Panggilan", "Gagal", "Token", "Rata-rata", "Terakhir dipakai"]}
          >
            {data.per_penyedia.map((provider) => (
              <tr
                key={`${provider.provider_id}-${provider.label}-${provider.model}`}
                className="border-t border-line align-top"
              >
                <td className={bodyCellClass}>
                  <span className="font-medium">{provider.label}</span>
                  <span className="block font-mono text-xs break-all text-ink-muted">{provider.model}</span>
                </td>
                <td className={cx(bodyCellClass, "font-mono")}>{formatNumber(provider.panggilan)}</td>
                <td className={cx(bodyCellClass, "font-mono", provider.gagal > 0 && "text-danger")}>
                  {formatNumber(provider.gagal)}
                  {provider.gagal > 0 && ` (${percent(provider.gagal, provider.panggilan)})`}
                </td>
                <td className={cx(bodyCellClass, "font-mono")}>{formatNumber(provider.token)}</td>
                <td className={cx(bodyCellClass, "font-mono whitespace-nowrap")}>{formatMs(provider.rata_ms)}</td>
                <td className={cx(bodyCellClass, "whitespace-nowrap")}>{formatDateTime(provider.terakhir)}</td>
              </tr>
            ))}
          </UsageTable>
          <div className="grid gap-4 xl:grid-cols-[2fr_3fr]">
            <UsageTable title="Per fitur" columns={["Fitur", "Panggilan", "Gagal", "Token"]}>
              {data.per_fitur.map((feature) => (
                <tr key={feature.fitur} className="border-t border-line">
                  <td className={bodyCellClass}>{FEATURE_LABELS[feature.fitur] ?? feature.fitur}</td>
                  <td className={cx(bodyCellClass, "font-mono")}>{formatNumber(feature.panggilan)}</td>
                  <td className={cx(bodyCellClass, "font-mono", feature.gagal > 0 && "text-danger")}>
                    {formatNumber(feature.gagal)}
                  </td>
                  <td className={cx(bodyCellClass, "font-mono")}>{formatNumber(feature.token)}</td>
                </tr>
              ))}
            </UsageTable>
            {data.gagal_terakhir.length ? (
              <UsageTable title="Gagal terakhir" columns={["Waktu (WIB)", "Penyedia", "Fitur", "Pesan"]}>
                {data.gagal_terakhir.map((failure, i) => (
                  <tr key={`${failure.created_at}-${i}`} className="border-t border-line align-top">
                    <td className={cx(bodyCellClass, "whitespace-nowrap")}>{formatDateTime(failure.created_at)}</td>
                    <td className={bodyCellClass}>{failure.label}</td>
                    <td className={bodyCellClass}>{FEATURE_LABELS[failure.fitur] ?? failure.fitur}</td>
                    <td className={cx(bodyCellClass, "text-danger")}>{failure.error ?? "-"}</td>
                  </tr>
                ))}
              </UsageTable>
            ) : (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Gagal terakhir</h3>
                <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-ink-muted">
                  Tidak ada panggilan gagal.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
