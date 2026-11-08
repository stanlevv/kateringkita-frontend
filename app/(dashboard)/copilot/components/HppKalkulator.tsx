"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input } from "@/app/components/ui/Input";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { formatRupiah } from "@/lib/format";
import { cekHpp, hitungHpp } from "@/lib/hpp";

type Baris = { k: number; nama: string; biaya: string; porsi: string };
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

/** M-12 (P2), HP-N1/N2/E1: hitung HPP per porsi dan saran harga; hasil langsung. */
export function HppKalkulator() {
  const [baris, setBaris] = useState<Baris[]>([{ k: 0, nama: "", biaya: "", porsi: "" }]);
  const [margin, setMargin] = useState("30");
  const [berikut, setBerikut] = useState(1);
  const [tersentuh, setTersentuh] = useState<Set<string>>(new Set());

  const bahan = baris.map((b) => ({ nama: b.nama, biaya: num(b.biaya), porsi: num(b.porsi) }));
  const galat = cekHpp(bahan, num(margin));
  const hasil = Object.keys(galat).length === 0 ? hitungHpp(bahan, num(margin)) : null;

  const ubah = (k: number, f: Partial<Baris>) => setBaris((r) => r.map((b) => (b.k === k ? { ...b, ...f } : b)));
  const sentuh = (id: string) => () => setTersentuh((s) => new Set(s).add(id));
  const tampilGalat = (id: string) => (tersentuh.has(id) ? galat[id] : undefined);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Bahan" className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Bahan</h2>
        {baris.map((b, i) => (
          <div key={b.k} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_auto] sm:items-start">
            <Field label={`Nama bahan ${i + 1}`} id={`hpp-nama-${b.k}`}>
              <Input value={b.nama} onChange={(e) => ubah(b.k, { nama: e.target.value })} />
            </Field>
            <Field label={`Biaya (Rp) bahan ${i + 1}`} id={`hpp-biaya-${b.k}`} error={tampilGalat(`${i}.biaya`)}>
              <Input type="number" inputMode="numeric" min={1} step={1} value={b.biaya} onChange={(e) => ubah(b.k, { biaya: e.target.value })} onBlur={sentuh(`${i}.biaya`)} />
            </Field>
            <Field label={`Porsi bahan ${i + 1}`} id={`hpp-porsi-${b.k}`} error={tampilGalat(`${i}.porsi`)}>
              <Input type="number" inputMode="numeric" min={1} step={1} value={b.porsi} onChange={(e) => ubah(b.k, { porsi: e.target.value })} onBlur={sentuh(`${i}.porsi`)} />
            </Field>
            {baris.length > 1 && (
              <IconButton icon={Trash2} label={`Hapus bahan ${i + 1}`} onClick={() => setBaris((r) => r.filter((x) => x.k !== b.k))} className="sm:mt-7" />
            )}
          </div>
        ))}
        <div>
          <Button variant="secondary" onClick={() => { setBaris((r) => [...r, { k: berikut, nama: "", biaya: "", porsi: "" }]); setBerikut((n) => n + 1); }}>
            <Plus aria-hidden className="size-4" />Tambah bahan
          </Button>
        </div>
        <div className="max-w-xs">
          <Field label="Target margin (%)" id="hpp-margin" help="Antara 0 dan 90." error={tampilGalat("margin")}>
            <Input type="number" inputMode="numeric" min={0} max={90} step={1} value={margin} onChange={(e) => setMargin(e.target.value)} onBlur={sentuh("margin")} />
          </Field>
        </div>
      </section>

      <aside aria-label="Hasil" aria-live="polite" className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Hasil</h2>
        {hasil ? (
          <>
            <p className="text-ink-muted">HPP per porsi</p>
            <p data-testid="hpp" className="font-mono text-2xl font-bold text-ink">{formatRupiah(hasil.hpp)}</p>
            <p className="text-ink-muted">Saran harga jual (dibulatkan ke Rp 500)</p>
            <p data-testid="harga" className="font-mono text-2xl font-bold text-primary">{formatRupiah(hasil.suggested_price)}</p>
            <LinkButton href={`/menu/baru?hpp=${hasil.hpp}&price=${hasil.suggested_price}`}>Pakai untuk menu</LinkButton>
          </>
        ) : (
          <p className="text-ink-muted">Lengkapi biaya dan porsi setiap bahan untuk melihat hasil.</p>
        )}
      </aside>
    </div>
  );
}
