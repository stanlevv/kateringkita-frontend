"use client";

// Klien: seri membawa komponen ikon (fungsi), tidak bisa dikirim dari Server Component
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { GrafikBatang } from "@/app/components/ui/GrafikBatang";
import { formatJam } from "@/lib/format";
import type { JamServer } from "@/types/server";

// Warna status tetap (skill dataviz: critical & warning). Kuning < 3:1 di latar terang → selalu berpasangan ikon + label + tabel.
const SERI = [
  { kunci: "error", nama: "Error 5xx", pendek: "error", warna: "#d03b3b", ikon: CircleX },
  { kunci: "lambat", nama: "Lambat > 2 dtk", pendek: "lambat", warna: "#fab219", ikon: Clock },
];

/** Error 5xx (bawah) dan request lambat (atas) per jam, 24 jam terakhir. */
export function GrafikPerJam({ data }: { data: JamServer[] }) {
  return (
    <GrafikBatang judul="Masalah per jam" keterangan="24 jam terakhir, jam WIB." seri={SERI} kolomLabel="Jam (WIB)"
      data={data.map((d) => ({ label: formatJam(d.jam), lengkap: `${formatJam(d.jam)} WIB`, nilai: { error: d.error, lambat: d.lambat } }))}
      sumbu={[0, 6, 12, 18, data.length - 1]}
      kosong={(
        <p className="inline-flex items-center gap-2 rounded-lg bg-success-bg px-4 py-3 text-success">
          <CircleCheck aria-hidden className="size-5" />Tidak ada error atau request lambat dalam 24 jam terakhir.
        </p>
      )} />
  );
}
