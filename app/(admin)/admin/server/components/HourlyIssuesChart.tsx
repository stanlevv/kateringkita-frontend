// Komponen HourlyIssuesChart: grafik batang "Masalah per jam" di /admin/server. Tiap batang = satu jam WIB dalam
// 24 jam terakhir, berisi jumlah error 5xx dan request lambat. Data dari `per_jam` di GET /admin/server-status
// (diambil page.tsx). Tanpa masalah sama sekali, grafik diganti pesan hijau.
// "use client": seri grafik membawa komponen ikon (fungsi), dan fungsi tidak bisa dikirim dari server component.
"use client";

import { CircleCheck, CircleX, Clock } from "lucide-react";
import { BarChart } from "@/app/components/ui/BarChart";
import { formatTime } from "@/lib/format";
import type { HourlyServerStats } from "@/types/server";

// Dua seri grafik; `key` sama dengan nama field di data backend (error, lambat). Warna status tetap (merah untuk
// kritis, kuning untuk peringatan). Kuning kontrasnya < 3:1 di latar terang, jadi selalu berpasangan ikon + label +
// tabel.
const SERIES = [
  { key: "error", name: "Error 5xx", shortName: "error", color: "#d03b3b", icon: CircleX },
  { key: "lambat", name: "Lambat > 2 dtk", shortName: "lambat", color: "#fab219", icon: Clock },
];

/**
 * Error 5xx (bawah) dan request lambat (atas) per jam, 24 jam terakhir.
 * @param props.data jumlah masalah per jam dari backend (24 butir)
 * @returns BarChart
 */
export function HourlyIssuesChart({ data }: { data: HourlyServerStats[] }) {
  return (
    <BarChart
      title="Masalah per jam"
      description="24 jam terakhir, jam WIB."
      series={SERIES}
      columnLabel="Jam (WIB)"
      data={data.map((hour) => ({
        label: formatTime(hour.jam),
        fullLabel: `${formatTime(hour.jam)} WIB`,
        values: { error: hour.error, lambat: hour.lambat },
      }))}
      axisTicks={[0, 6, 12, 18, data.length - 1]}
      empty={
        <p className="inline-flex items-center gap-2 rounded-lg bg-success-bg px-4 py-3 text-success">
          <CircleCheck aria-hidden className="size-5" />
          Tidak ada error atau request lambat dalam 24 jam terakhir.
        </p>
      }
    />
  );
}
