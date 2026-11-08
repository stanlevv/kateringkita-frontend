"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { formatRupiah } from "@/lib/format";
import type { HourlyPoint } from "@/types/report";

const W = 640, H = 240, KIRI = 88, KANAN = 8, ATAS = 24, BAWAH = 36;
const jam = (h: number) => `${String(h).padStart(2, "0")}.00`;

// Batas atas sumbu: 1, 2, atau 5 kali pangkat sepuluh.
function batas(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 5, 10].find((k) => k * p >= v) ?? 10) * p;
}

/** LP-N2 (D6). Batang SVG buatan sendiri; tiap batang bisa difokus, ada tooltip dan tabel untuk pembaca layar. */
export function HourlyChart({ points, hari }: { points: HourlyPoint[]; hari: number }) {
  const [aktif, setAktif] = useState<number | null>(null);
  const kosong = points.length === 0 || points.every((p) => p.revenue === 0);
  const subjudul = hari > 1 ? `Penjualan per jam dijumlahkan dari ${hari} hari yang dipilih.` : "Penjualan per jam pada tanggal yang dipilih.";

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-ink">Penjualan per jam</h2>
        <p className="text-sm text-ink-muted">{subjudul}</p>
      </div>
      {kosong ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <BarChart3 aria-hidden className="size-8 text-ink-muted" />
          <p className="font-medium text-ink">Belum ada penjualan di rentang ini</p>
          <p className="text-sm text-ink-muted">Grafik muncul setelah ada pesanan yang selesai.</p>
        </div>
      ) : (
        <Grafik points={points} aktif={aktif} setAktif={setAktif} />
      )}
    </Card>
  );
}

function Grafik({ points, aktif, setAktif }: { points: HourlyPoint[]; aktif: number | null; setAktif: (i: number | null) => void }) {
  const maks = batas(Math.max(...points.map((p) => p.revenue)));
  const lebar = (W - KIRI - KANAN) / points.length;
  const tinggi = H - ATAS - BAWAH;
  const lebarBatang = Math.min(56, lebar * 0.6);
  const x = (i: number) => KIRI + lebar * i + lebar / 2;
  const y = (v: number) => ATAS + tinggi * (1 - v / maks);
  const p = aktif === null ? null : points[aktif];

  return (
    <div>
      {/* Di layar sempit grafik digeser mendatar agar label tetap terbaca (jsdom tidak mengukur tata letak). */}
      <div className="overflow-x-auto">
      <div className="relative min-w-[560px]">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Grafik batang penjualan per jam" className="w-full">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={KIRI} x2={W - KANAN} y1={y(maks * f)} y2={y(maks * f)} className="stroke-line" />
            <text x={KIRI - 8} y={y(maks * f) + 4} textAnchor="end" fontSize="11" className="fill-ink-muted">{formatRupiah(maks * f)}</text>
          </g>
        ))}
        {points.map((pt, i) => (
          <g key={pt.hour}>
            <rect
              role="img"
              tabIndex={0}
              aria-label={`Jam ${jam(pt.hour)}: ${pt.orders} pesanan, ${formatRupiah(pt.revenue)}`}
              x={x(i) - lebarBatang / 2}
              y={y(pt.revenue)}
              width={lebarBatang}
              height={Math.max(2, ATAS + tinggi - y(pt.revenue))}
              rx={3}
              onMouseEnter={() => setAktif(i)}
              onMouseLeave={() => setAktif(null)}
              onFocus={() => setAktif(i)}
              onBlur={() => setAktif(null)}
              className="fill-primary stroke-focus outline-none hover:fill-primary-pressed focus-visible:fill-primary-pressed focus-visible:stroke-[3]"
              strokeWidth={0}
            />
            <text x={x(i)} y={y(pt.revenue) - 6} textAnchor="middle" fontSize="11" className="fill-ink">{pt.orders}</text>
            <text x={x(i)} y={H - 16} textAnchor="middle" fontSize="11" className="fill-ink-muted">{String(pt.hour).padStart(2, "0")}</text>
          </g>
        ))}
        <text x={KIRI + (W - KIRI - KANAN) / 2} y={H - 2} textAnchor="middle" fontSize="11" className="fill-ink-muted">Jam (WIB); angka di atas batang = jumlah pesanan</text>
      </svg>
      {p && aktif !== null && (
        <div
          role="tooltip"
          style={{ left: `${(x(aktif) / W) * 100}%`, top: `${(y(p.revenue) / H) * 100}%` }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-surface px-3 py-2 text-sm shadow-lg"
        >
          <p className="font-semibold text-ink">Jam {jam(p.hour)}</p>
          <p className="text-ink-muted">{p.orders} pesanan, {p.portions} porsi</p>
          <p className="font-mono text-ink">{formatRupiah(p.revenue)}</p>
        </div>
      )}
      </div>
      </div>
      <div className="sr-only">
        <table>
          <caption>Penjualan per jam</caption>
          <thead>
            <tr><th scope="col">Jam</th><th scope="col">Pesanan</th><th scope="col">Porsi</th><th scope="col">Omzet</th></tr>
          </thead>
          <tbody>
            {points.map((pt) => (
              <tr key={pt.hour}><th scope="row">{jam(pt.hour)}</th><td>{pt.orders}</td><td>{pt.portions}</td><td>{formatRupiah(pt.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
