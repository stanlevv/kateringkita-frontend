// Komponen HourlyChart: grafik batang penjualan per jam di /laporan. Titik per jam datang dari halaman (backend
// GET /merchant/reports/hourly, atau dijumlahkan dari transaksi bila rentangnya lebih dari satu hari).
// Grafik digambar sendiri dengan SVG (gambar vektor di dalam HTML), tanpa pustaka grafik.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { formatRupiah } from "@/lib/format";
import type { HourlyPoint } from "@/types/report";

// Ukuran kanvas SVG dan jarak tepi (ruang label sumbu di kiri dan label jam di bawah), dalam satuan viewBox.
const WIDTH = 640,
  HEIGHT = 240,
  PADDING_LEFT = 88,
  PADDING_RIGHT = 8,
  PADDING_TOP = 24,
  PADDING_BOTTOM = 36;
/** Jam sebagai teks "HH.00", mis. 9 -> "09.00". */
const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}.00`;

/**
 * Batas atas sumbu agar angka sumbu bulat: 1, 2, 5, atau 10 kali pangkat sepuluh dari nilai.
 * @param value omzet tertinggi
 * @returns batas atas sumbu, mis. 508.000 -> 1.000.000
 */
function roundUpAxisMax(value: number) {
  const power = 10 ** Math.floor(Math.log10(value));
  return ([1, 2, 5, 10].find((multiplier) => multiplier * power >= value) ?? 10) * power;
}

/**
 * Kartu "Penjualan per jam". Tiap batang bisa difokus dengan Tab dan menampilkan tooltip; ada juga tabel tersembunyi
 * (sr-only) berisi angka yang sama untuk pembaca layar.
 * @param props.points titik per jam (jam, jumlah pesanan, porsi, omzet)
 * @param props.days jumlah hari dalam rentang; lebih dari 1 mengubah subjudul menjadi "dijumlahkan"
 * @returns Card berisi grafik, atau pesan kosong bila belum ada penjualan
 */
export function HourlyChart({ points, days }: { points: HourlyPoint[]; days: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isEmpty = points.length === 0 || points.every((point) => point.revenue === 0);
  const subtitle =
    days > 1
      ? `Penjualan per jam dijumlahkan dari ${days} hari yang dipilih.`
      : "Penjualan per jam pada tanggal yang dipilih.";

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-ink">Penjualan per jam</h2>
        <p className="text-sm text-ink-muted">{subtitle}</p>
      </div>
      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <BarChart3 aria-hidden className="size-8 text-ink-muted" />
          <p className="font-medium text-ink">Belum ada penjualan di rentang ini</p>
          <p className="text-sm text-ink-muted">Grafik muncul setelah ada pesanan yang selesai.</p>
        </div>
      ) : (
        <HourlyBars points={points} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      )}
    </Card>
  );
}

/**
 * Isi grafik: garis bantu, batang per jam, tooltip batang aktif, dan tabel untuk pembaca layar.
 * @param props.points titik per jam
 * @param props.activeIndex indeks batang yang disorot (hover atau fokus), null bila tidak ada
 * @param props.setActiveIndex pengubah batang aktif
 * @returns grafik SVG dan tabel sr-only
 */
function HourlyBars({
  points,
  activeIndex,
  setActiveIndex,
}: {
  points: HourlyPoint[];
  activeIndex: number | null;
  setActiveIndex: (i: number | null) => void;
}) {
  // 1. Skala: tiap jam mendapat slot selebar sama; tinggi batang sebanding omzet terhadap batas atas sumbu.
  const axisMax = roundUpAxisMax(Math.max(...points.map((point) => point.revenue)));
  const slotWidth = (WIDTH - PADDING_LEFT - PADDING_RIGHT) / points.length;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const barWidth = Math.min(56, slotWidth * 0.6);
  const barCenterX = (i: number) => PADDING_LEFT + slotWidth * i + slotWidth / 2;
  const valueToY = (value: number) => PADDING_TOP + plotHeight * (1 - value / axisMax);
  // 2. Titik yang sedang disorot (hover atau fokus) untuk tooltip.
  const activePoint = activeIndex === null ? null : points[activeIndex];

  return (
    <div>
      {/* Di layar sempit grafik digeser mendatar agar label tetap terbaca (jsdom tidak mengukur tata letak). */}
      <div className="overflow-x-auto">
        <div className="relative min-w-[560px]">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="group"
            aria-label="Grafik batang penjualan per jam"
            className="w-full"
          >
            {[0, 0.5, 1].map((fraction) => (
              <g key={fraction}>
                <line
                  x1={PADDING_LEFT}
                  x2={WIDTH - PADDING_RIGHT}
                  y1={valueToY(axisMax * fraction)}
                  y2={valueToY(axisMax * fraction)}
                  className="stroke-line"
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={valueToY(axisMax * fraction) + 4}
                  textAnchor="end"
                  fontSize="11"
                  className="fill-ink-muted"
                >
                  {formatRupiah(axisMax * fraction)}
                </text>
              </g>
            ))}
            {points.map((point, i) => (
              <g key={point.hour}>
                <rect
                  role="img"
                  tabIndex={0}
                  aria-label={`Jam ${formatHour(point.hour)}: ${point.orders} pesanan, ${formatRupiah(point.revenue)}`}
                  x={barCenterX(i) - barWidth / 2}
                  y={valueToY(point.revenue)}
                  width={barWidth}
                  height={Math.max(2, PADDING_TOP + plotHeight - valueToY(point.revenue))}
                  rx={3}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(null)}
                  className="fill-primary stroke-focus outline-none hover:fill-primary-pressed focus-visible:fill-primary-pressed focus-visible:stroke-[3]"
                  strokeWidth={0}
                />
                <text
                  x={barCenterX(i)}
                  y={valueToY(point.revenue) - 6}
                  textAnchor="middle"
                  fontSize="11"
                  className="fill-ink"
                >
                  {point.orders}
                </text>
                <text x={barCenterX(i)} y={HEIGHT - 16} textAnchor="middle" fontSize="11" className="fill-ink-muted">
                  {String(point.hour).padStart(2, "0")}
                </text>
              </g>
            ))}
            <text
              x={PADDING_LEFT + (WIDTH - PADDING_LEFT - PADDING_RIGHT) / 2}
              y={HEIGHT - 2}
              textAnchor="middle"
              fontSize="11"
              className="fill-ink-muted"
            >
              Jam (WIB); angka di atas batang = jumlah pesanan
            </text>
          </svg>
          {activePoint && activeIndex !== null && (
            <div
              role="tooltip"
              style={{
                left: `${(barCenterX(activeIndex) / WIDTH) * 100}%`,
                top: `${(valueToY(activePoint.revenue) / HEIGHT) * 100}%`,
              }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-surface px-3 py-2 text-sm shadow-lg"
            >
              <p className="font-semibold text-ink">Jam {formatHour(activePoint.hour)}</p>
              <p className="text-ink-muted">
                {activePoint.orders} pesanan, {activePoint.portions} porsi
              </p>
              <p className="font-mono text-ink">{formatRupiah(activePoint.revenue)}</p>
            </div>
          )}
        </div>
      </div>
      <div className="sr-only">
        <table>
          <caption>Penjualan per jam</caption>
          <thead>
            <tr>
              <th scope="col">Jam</th>
              <th scope="col">Pesanan</th>
              <th scope="col">Porsi</th>
              <th scope="col">Omzet</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.hour}>
                <th scope="row">{formatHour(point.hour)}</th>
                <td>{point.orders}</td>
                <td>{point.portions}</td>
                <td>{formatRupiah(point.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
