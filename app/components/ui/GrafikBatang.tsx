"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { cx, fokus } from "./cx";

export type SeriBatang = { kunci: string; nama: string; pendek: string; warna: string; ikon?: LucideIcon };
/** `label` untuk sumbu & tabel; `lengkap` untuk tooltip/pembaca layar (bawaan = label). */
export type TitikBatang = { label: string; lengkap?: string; nilai: Record<string, number> };

const TINGGI = 160;
const angka = (n: number) => n.toLocaleString("id-ID");

/**
 * Batang (bertumpuk bila > 1 seri, seri[0] di bawah) dengan tooltip saat disorot/difokus dan tabel "Lihat tabel".
 * Spek dataviz: batang ≤ 24px di tengah slot (slot = area sentuh), celah 2px antarsegmen, ujung atas membulat 4px,
 * legenda (ikon + nama + total) hanya untuk ≥ 2 seri; satu seri cukup dinamai judul.
 */
export function GrafikBatang({ judul, keterangan, seri, data, sumbu, kolomLabel, kosong }: {
  judul: string; keterangan: string; seri: SeriBatang[]; data: TitikBatang[]; sumbu: number[]; kolomLabel: string; kosong: ReactNode;
}) {
  const [aktif, setAktif] = useState<number | null>(null);
  const jumlah = (d: TitikBatang) => seri.reduce((s, x) => s + (d.nilai[x.kunci] ?? 0), 0);
  const puncak = Math.max(1, ...data.map(jumlah));
  const total = (k: string) => data.reduce((s, d) => s + (d.nilai[k] ?? 0), 0);
  const tengah = (i: number) => ((i + 0.5) / data.length) * 100;
  const rinci = (d: TitikBatang, pisah: string) => seri.map((x) => `${angka(d.nilai[x.kunci] ?? 0)} ${x.pendek}`).join(pisah);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{judul}</h2>
          <p className="text-sm text-ink-muted">{keterangan}</p>
        </div>
        {seri.length > 1 && (
          <ul aria-label="Legenda" className="flex flex-wrap gap-4 text-sm">
            {seri.map((x) => (
              <li key={x.kunci} className="inline-flex items-center gap-1.5">
                {x.ikon ? <x.ikon aria-hidden className="size-4" style={{ color: x.warna }} /> : <span aria-hidden className="size-3 rounded-sm" style={{ background: x.warna }} />}
                {x.nama} <span className="font-mono font-semibold">{angka(total(x.kunci))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.every((d) => jumlah(d) === 0) ? kosong : (
        <div className="relative pt-10">
          {aktif !== null && (
            <div role="status" style={{ left: `clamp(7.5rem, ${tengah(aktif)}%, calc(100% - 7.5rem))` }}
              className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md bg-steel px-3 py-1.5 text-sm text-on-steel shadow-lg">
              <span className="font-semibold">{data[aktif].lengkap ?? data[aktif].label}</span> · {rinci(data[aktif], " · ")}
            </div>
          )}
          <div className="flex items-end gap-1 border-b border-line" style={{ height: TINGGI }} onMouseLeave={() => setAktif(null)}>
            {data.map((d, i) => (
              <button key={`${d.label}-${i}`} type="button" aria-label={`${d.lengkap ?? d.label}: ${rinci(d, ", ")}`}
                onMouseEnter={() => setAktif(i)} onFocus={() => setAktif(i)} onBlur={() => setAktif(null)}
                className={cx("flex h-full min-w-0 flex-1 flex-col justify-end", fokus)}>
                <span className="mx-auto flex w-full max-w-6 flex-col-reverse gap-[2px]" style={{ height: (jumlah(d) / puncak) * TINGGI }}>
                  {seri.map((x) => {
                    const v = d.nilai[x.kunci] ?? 0;
                    const atas = seri.findLast((y) => (d.nilai[y.kunci] ?? 0) > 0)?.kunci === x.kunci;
                    return v > 0 && <span key={x.kunci} className={cx("w-full", atas && "rounded-t-[4px]")} style={{ flexGrow: v, background: x.warna }} />;
                  })}
                </span>
              </button>
            ))}
          </div>
          <div aria-hidden className="relative mt-1 h-4 text-xs text-ink-muted">
            {sumbu.filter((i) => i >= 0 && i < data.length).map((i) => (
              <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${tengah(i)}%` }}>{data[i].label}</span>
            ))}
          </div>
        </div>
      )}

      <details className="text-sm">
        <summary className={cx("cursor-pointer font-medium text-primary", fokus)}>Lihat tabel</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-ink-muted">
            <tr><th className="py-1 font-medium">{kolomLabel}</th>{seri.map((x) => <th key={x.kunci} className="py-1 font-medium">{x.nama}</th>)}</tr>
          </thead>
          <tbody className="font-mono">
            {data.map((d, i) => (
              <tr key={`${d.label}-${i}`} className="border-t border-line">
                <td className="py-1">{d.label}</td>{seri.map((x) => <td key={x.kunci}>{angka(d.nilai[x.kunci] ?? 0)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  );
}
