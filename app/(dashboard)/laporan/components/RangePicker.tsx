"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cekRentang, hariSebelum } from "@/lib/laporan";
import { cx, fokus } from "@/app/components/ui/cx";
import { Input } from "@/app/components/ui/Input";

/** LP-N1, LP-E1. Rentang tinggal di URL (`dari`, `sampai`); isian tidak sah ditolak di sini dan tidak mengubah URL. */
export function RangePicker({ dari, sampai, hariIni, galat }: { dari: string; sampai: string; hariIni: string; galat: string | null }) {
  const router = useRouter();
  const path = usePathname();
  const preset = [
    { label: "Hari ini", dari: hariIni },
    { label: "7 hari", dari: hariSebelum(hariIni, 6) },
    { label: "30 hari", dari: hariSebelum(hariIni, 29) },
  ];
  const aktif = preset.find((p) => p.dari === dari && sampai === hariIni)?.label;
  const [kustom, setKustom] = useState(!aktif || !!galat);
  const [isi, setIsi] = useState({ dari, sampai });
  const [galatLokal, setGalatLokal] = useState<string | null>(null);
  const pesan = galatLokal ?? galat;

  const ke = (d: string, s: string) => router.replace(`${path}?dari=${d}&sampai=${s}`, { scroll: false });

  function ubah(bagian: "dari" | "sampai", nilai: string) {
    const baru = { ...isi, [bagian]: nilai };
    setIsi(baru);
    const g = cekRentang(baru.dari, baru.sampai, hariIni);
    setGalatLokal(g);
    if (!g) ke(baru.dari, baru.sampai);
  }

  function pilih(p: (typeof preset)[number]) {
    setKustom(false);
    setGalatLokal(null);
    setIsi({ dari: p.dari, sampai: hariIni });
    ke(p.dari, hariIni);
  }

  const tombol = (on: boolean) =>
    cx("inline-flex min-h-11 items-center rounded-md border px-4 font-medium", fokus, on ? "border-primary bg-primary-soft text-primary" : "border-line-strong bg-surface text-ink hover:bg-subtle");

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Rentang laporan" className="flex flex-wrap gap-2">
        {preset.map((p) => {
          const on = !kustom && aktif === p.label;
          return <button key={p.label} type="button" aria-pressed={on} onClick={() => pilih(p)} className={tombol(on)}>{p.label}</button>;
        })}
        <button type="button" aria-pressed={kustom} onClick={() => setKustom(true)} className={tombol(kustom)}>Pilih tanggal</button>
      </div>
      {kustom && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">Dari tanggal
            <Input type="date" value={isi.dari} max={hariIni} aria-invalid={!!pesan} aria-describedby={pesan ? "galat-rentang" : undefined} onChange={(e) => ubah("dari", e.target.value)} className="sm:w-44" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">Sampai tanggal
            <Input type="date" value={isi.sampai} max={hariIni} aria-invalid={!!pesan} aria-describedby={pesan ? "galat-rentang" : undefined} onChange={(e) => ubah("sampai", e.target.value)} className="sm:w-44" />
          </label>
        </div>
      )}
      {pesan && <p id="galat-rentang" role="alert" className="text-sm font-medium text-danger">{pesan}</p>}
    </div>
  );
}
