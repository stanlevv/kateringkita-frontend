// Komponen BarChart: grafik batang (bertumpuk bila lebih dari satu seri) dengan tooltip dan tabel data untuk
// aksesibilitas.
// Dipakai PemakaianAi (token per hari) dan GrafikPerJam (masalah server per jam) di panel admin.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { cx, focusRing } from "./cx";

/** Satu seri: kunci nilai, nama di legenda/tabel, nama pendek di tooltip, warna, dan ikon opsional. */
export type BarSeries = { key: string; name: string; shortName: string; color: string; icon?: LucideIcon };
/** Satu titik (batang): `label` untuk sumbu & tabel; `fullLabel` untuk tooltip/pembaca layar (bawaan = label). */
export type BarPoint = { label: string; fullLabel?: string; values: Record<string, number> };

// Tinggi area batang (px) dan format angka Indonesia (1.234).
const CHART_HEIGHT = 160;
const formatNumber = (value: number) => value.toLocaleString("id-ID");

/**
 * Batang (bertumpuk bila > 1 seri, seri[0] di bawah) dengan tooltip saat disorot/difokus dan tabel "Lihat tabel".
 * Spek dataviz: batang ≤ 24px di tengah slot (slot = area sentuh), celah 2px antarsegmen, ujung atas membulat 4px,
 * legenda (ikon + nama + total) hanya untuk ≥ 2 seri; satu seri cukup dinamai judul.
 * @param props.title judul grafik
 * @param props.description keterangan di bawah judul
 * @param props.series daftar seri (seri pertama paling bawah)
 * @param props.data titik-titik grafik
 * @param props.axisTicks indeks titik yang labelnya ditulis di sumbu bawah
 * @param props.columnLabel judul kolom pertama di tabel data
 * @param props.empty tampilan bila semua nilai nol
 * @returns Card berisi grafik dan tabel "Lihat tabel"
 */
export function BarChart({
  title,
  description,
  series,
  data,
  axisTicks,
  columnLabel,
  empty,
}: {
  title: string;
  description: string;
  series: BarSeries[];
  data: BarPoint[];
  axisTicks: number[];
  columnLabel: string;
  empty: ReactNode;
}) {
  // 1. Batang yang sedang disorot/difokus (untuk tooltip).
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // 2. Hitungan: total per titik, puncak (skala tinggi), total per seri, posisi tengah slot, dan teks rincian.
  const pointTotal = (point: BarPoint) =>
    series.reduce((sum, seriesItem) => sum + (point.values[seriesItem.key] ?? 0), 0);
  const peak = Math.max(1, ...data.map(pointTotal));
  const seriesTotal = (seriesKey: string) => data.reduce((sum, point) => sum + (point.values[seriesKey] ?? 0), 0);
  const slotCenter = (i: number) => ((i + 0.5) / data.length) * 100;
  const describePoint = (point: BarPoint, separator: string) =>
    series
      .map((seriesItem) => `${formatNumber(point.values[seriesItem.key] ?? 0)} ${seriesItem.shortName}`)
      .join(separator);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <p className="text-sm text-ink-muted">{description}</p>
        </div>
        {series.length > 1 && (
          <ul aria-label="Legenda" className="flex flex-wrap gap-4 text-sm">
            {series.map((seriesItem) => (
              <li key={seriesItem.key} className="inline-flex items-center gap-1.5">
                {seriesItem.icon ? (
                  <seriesItem.icon aria-hidden className="size-4" style={{ color: seriesItem.color }} />
                ) : (
                  <span aria-hidden className="size-3 rounded-sm" style={{ background: seriesItem.color }} />
                )}
                {seriesItem.name}{" "}
                <span className="font-mono font-semibold">{formatNumber(seriesTotal(seriesItem.key))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.every((point) => pointTotal(point) === 0) ? (
        empty
      ) : (
        <div className="relative pt-10">
          {activeIndex !== null && (
            <div
              role="status"
              style={{ left: `clamp(7.5rem, ${slotCenter(activeIndex)}%, calc(100% - 7.5rem))` }}
              className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md bg-steel px-3 py-1.5 text-sm text-on-steel shadow-lg"
            >
              <span className="font-semibold">{data[activeIndex].fullLabel ?? data[activeIndex].label}</span> ·{" "}
              {describePoint(data[activeIndex], " · ")}
            </div>
          )}
          <div
            className="flex items-end gap-1 border-b border-line"
            style={{ height: CHART_HEIGHT }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((point, i) => (
              <button
                key={`${point.label}-${i}`}
                type="button"
                aria-label={`${point.fullLabel ?? point.label}: ${describePoint(point, ", ")}`}
                onMouseEnter={() => setActiveIndex(i)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex(null)}
                className={cx("flex h-full min-w-0 flex-1 flex-col justify-end", focusRing)}
              >
                <span
                  className="mx-auto flex w-full max-w-6 flex-col-reverse gap-[2px]"
                  style={{ height: (pointTotal(point) / peak) * CHART_HEIGHT }}
                >
                  {series.map((seriesItem) => {
                    const value = point.values[seriesItem.key] ?? 0;
                    const isTop =
                      series.findLast((otherItem) => (point.values[otherItem.key] ?? 0) > 0)?.key === seriesItem.key;
                    return (
                      value > 0 && (
                        <span
                          key={seriesItem.key}
                          className={cx("w-full", isTop && "rounded-t-[4px]")}
                          style={{ flexGrow: value, background: seriesItem.color }}
                        />
                      )
                    );
                  })}
                </span>
              </button>
            ))}
          </div>
          <div aria-hidden className="relative mt-1 h-4 text-xs text-ink-muted">
            {axisTicks
              .filter((i) => i >= 0 && i < data.length)
              .map((i) => (
                <span
                  key={i}
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${slotCenter(i)}%` }}
                >
                  {data[i].label}
                </span>
              ))}
          </div>
        </div>
      )}

      <details className="text-sm">
        <summary className={cx("cursor-pointer font-medium text-primary", focusRing)}>Lihat tabel</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-ink-muted">
            <tr>
              <th className="py-1 font-medium">{columnLabel}</th>
              {series.map((seriesItem) => (
                <th key={seriesItem.key} className="py-1 font-medium">
                  {seriesItem.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {data.map((point, i) => (
              <tr key={`${point.label}-${i}`} className="border-t border-line">
                <td className="py-1">{point.label}</td>
                {series.map((seriesItem) => (
                  <td key={seriesItem.key}>{formatNumber(point.values[seriesItem.key] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  );
}
