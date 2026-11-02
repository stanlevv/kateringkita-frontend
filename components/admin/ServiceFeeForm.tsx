"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanBiayaLayanan } from "@/app/actions/admin/promos";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { cekBiaya } from "@/lib/admin/master";
import { formatRupiah } from "@/lib/format";

/** A-04 — biaya layanan per pesanan. */
export function ServiceFeeForm({ nilai }: { nilai: number }) {
  const router = useRouter();
  const [teks, setTeks] = useState(String(nilai));
  const [galat, setGalat] = useState<string>();
  const [menyimpan, setMenyimpan] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    const n = teks.trim() === "" ? NaN : Number(teks);
    const masalah = cekBiaya(n);
    if (masalah) return setGalat(masalah);
    setGalat(undefined);
    if (n === nilai) return void toast({ tone: "info", message: "Tidak ada perubahan" });
    setMenyimpan(true);
    const r = await panggil(() => simpanBiayaLayanan(n));
    setMenyimpan(false);
    if ("error" in r) return void toast({ tone: "danger", message: r.error.message });
    toast({ tone: "success", message: "Biaya layanan disimpan" });
    router.refresh();
  }

  return (
    <form onSubmit={kirim} noValidate aria-label="Biaya layanan" className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="text-lg font-semibold text-ink">Biaya layanan</h2>
      <p className="text-ink-muted">Saat ini <span className="font-mono font-semibold text-ink">{formatRupiah(nilai)}</span> per pesanan.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <Field label="Biaya baru (Rp)" id="biaya" help="Bilangan bulat 0–100.000." error={galat}>
            <Input type="number" inputMode="numeric" min={0} step={1} value={teks} onChange={(e) => { setGalat(undefined); setTeks(e.target.value); }} />
          </Field>
        </div>
        <Button type="submit" loading={menyimpan} loadingText="Menyimpan…">Simpan</Button>
      </div>
    </form>
  );
}
