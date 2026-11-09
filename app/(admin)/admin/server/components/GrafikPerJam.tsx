"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { cx, fokus } from "@/app/components/ui/cx";
import { formatJam } from "@/lib/format";
import type { JamServer } from "@/types/server";

// Warna status tetap (skill dataviz: critical & warning). Kuning < 3:1 di latar terang → selalu berpasangan ikon + label + tabel.
const WARNA = { error: "#d03b3b", lambat: "#fab219" } as const;
const TINGGI = 160;

/** Batang bertumpuk per jam (24 jam terakhir): error di bawah, lambat di atas; tooltip saat disorot/difokus. */
export function GrafikPerJam({ data }: { data: JamServer[] }) {
  const [aktif, setAktif] = useState<number | null>(null);
  const puncak = Math.max(1, ...data.map((d) => d.error + d.lambat));
  const total = data.reduce((s, d) => ({ error: s.error + d.error, lambat: s.lambat + d.lambat }), { error: 0, lambat: 0 });
  const kosong = total.error + total.lambat === 0;
  const tengah = (i: number) => ((i + 0.5) / data.length) * 100;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Masalah per jam</h2>
          <p className="text-sm text-ink-muted">24 jam terakhir, jam WIB.</p>
        </div>
        <ul aria-label="Legenda" className="flex flex-wrap gap-4 text-sm">
          <li className="inline-flex items-center gap-1.5"><CircleX aria-hidden className="size-4" style={{ color: WARNA.error }} />Error 5xx <span className="font-mono font-semibold">{total.error}</span></li>
          <li className="inline-flex items-center gap-1.5"><Clock aria-hidden className="size-4" style={{ color: WARNA.lambat }} />Lambat &gt; 2 dtk <span className="font-mono font-semibold">{total.lambat}</span></li>
        </ul>
      </div>

      {kosong ? (
        <p className="inline-flex items-center gap-2 rounded-lg bg-success-bg px-4 py-3 text-success">
          <CircleCheck aria-hidden className="size-5" />Tidak ada error atau request lambat dalam 24 jam terakhir.
        </p>
      ) : (
        <div className="relative pt-10">
          {aktif !== null && (
            <div role="status" style={{ left: `clamp(7.5rem, ${tengah(aktif)}%, calc(100% - 7.5rem))` }}
              className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md bg-steel px-3 py-1.5 text-sm text-on-steel shadow-lg">
              <span className="font-semibold">{formatJam(data[aktif].jam)} WIB</span> · {data[aktif].error} error · {data[aktif].lambat} lambat
            </div>
          )}
          <div className="flex items-end gap-1 border-b border-line" style={{ height: TINGGI }} onMouseLeave={() => setAktif(null)}>
            {data.map((d, i) => {
              const tinggi = ((d.error + d.lambat) / puncak) * TINGGI;
              return (
                <button key={d.jam} type="button" aria-label={`${formatJam(d.jam)} WIB: ${d.error} error, ${d.lambat} lambat`}
                  onMouseEnter={() => setAktif(i)} onFocus={() => setAktif(i)} onBlur={() => setAktif(null)}
                  className={cx("flex h-full min-w-0 flex-1 flex-col justify-end", fokus)}>
                  {/* batang maks 24px di tengah slot (slot = area sentuh); celah 2px antarsegmen; ujung atas membulat 4px */}
                  <span className="mx-auto flex w-full max-w-6 flex-col gap-[2px]" style={{ height: tinggi }}>
                    {d.lambat > 0 && <span className="w-full rounded-t-[4px]" style={{ flexGrow: d.lambat, background: WARNA.lambat }} />}
                    {d.error > 0 && <span className={cx("w-full", d.lambat === 0 && "rounded-t-[4px]")} style={{ flexGrow: d.error, background: WARNA.error }} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div aria-hidden className="relative mt-1 h-4 text-xs text-ink-muted">
            {[0, 6, 12, 18, data.length - 1].map((i) => (
              <span key={i} className="absolute -translate-x-1/2" style={{ left: `${tengah(i)}%` }}>{formatJam(data[i].jam)}</span>
            ))}
          </div>
        </div>
      )}

      <details className="text-sm">
        <summary className={cx("cursor-pointer font-medium text-primary", fokus)}>Lihat tabel</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-ink-muted"><tr><th className="py-1 font-medium">Jam (WIB)</th><th className="py-1 font-medium">Error</th><th className="py-1 font-medium">Lambat</th></tr></thead>
          <tbody className="font-mono">
            {data.map((d) => <tr key={d.jam} className="border-t border-line"><td className="py-1">{formatJam(d.jam)}</td><td>{d.error}</td><td>{d.lambat}</td></tr>)}
          </tbody>
        </table>
      </details>
    </Card>
  );
}
