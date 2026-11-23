"use client";

// Klien: seri membawa komponen ikon (fungsi), tidak bisa dikirim dari Server Component
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { BarChart } from "@/app/components/ui/BarChart";
import { formatTime } from "@/lib/format";
import type { HourlyServerStats } from "@/types/server";

// Warna status tetap (skill dataviz: critical & warning). Kuning < 3:1 di latar terang → selalu berpasangan ikon + label + tabel.
const SERI = [
  { key: "error", name: "Error 5xx", shortName: "error", color: "#d03b3b", icon: CircleX },
  { key: "lambat", name: "Lambat > 2 dtk", shortName: "lambat", color: "#fab219", icon: Clock },
];

/** Error 5xx (bawah) dan request lambat (atas) per jam, 24 jam terakhir. */
export function GrafikPerJam({ data }: { data: HourlyServerStats[] }) {
  return (
    <BarChart
      title="Masalah per jam"
      description="24 jam terakhir, jam WIB."
      series={SERI}
      columnLabel="Jam (WIB)"
      data={data.map((d) => ({
        label: formatTime(d.jam),
        fullLabel: `${formatTime(d.jam)} WIB`,
        values: { error: d.error, lambat: d.lambat },
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
