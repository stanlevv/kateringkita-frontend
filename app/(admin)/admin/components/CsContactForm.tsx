"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanKontakCs } from "@/app/actions/admin/promos";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";

/** Kontak CS (WhatsApp) yang tampil di aplikasi pembeli lewat GET /meta/settings. Kosong = belum diatur. */
export function CsContactForm({ nilai }: { nilai: string }) {
  const router = useRouter();
  const [teks, setTeks] = useState(nilai);
  const [galat, setGalat] = useState<string>();
  const [menyimpan, setMenyimpan] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    const nomor = teks.trim();
    if (nomor && !/^08\d{8,11}$/.test(nomor)) return setGalat("Nomor WA harus diawali 08 dan 10–13 digit.");
    setGalat(undefined);
    if (nomor === nilai) return void toast({ tone: "info", message: "Tidak ada perubahan" });
    setMenyimpan(true);
    const r = await panggil(() => simpanKontakCs(nomor));
    setMenyimpan(false);
    if ("error" in r) return void toast({ tone: "danger", message: r.error.message });
    toast({ tone: "success", message: nomor ? "Kontak CS disimpan" : "Kontak CS dikosongkan" });
    router.refresh();
  }

  return (
    <form onSubmit={kirim} noValidate aria-label="Kontak CS" className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="text-lg font-semibold text-ink">Kontak CS</h2>
      <p className="text-ink-muted">Nomor WhatsApp layanan pelanggan yang tampil di aplikasi pembeli.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <Field label="Nomor WhatsApp" id="cs-wa" help="Diawali 08. Kosongkan untuk menyembunyikan." error={galat}>
            <Input type="tel" inputMode="numeric" value={teks} onChange={(e) => { setGalat(undefined); setTeks(e.target.value); }} />
          </Field>
        </div>
        <Button type="submit" loading={menyimpan} loadingText="Menyimpan…">Simpan</Button>
      </div>
    </form>
  );
}
