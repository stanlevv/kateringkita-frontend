"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { balasTiket } from "@/app/actions/admin/tiket";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { BATAS_BALASAN } from "@/services/adminTiketService";

/**
 * Balas pembeli (1–2000 karakter). Galat validasi tampil di bawah isian (fields.body, atau pesan umumnya);
 * galat lain lewat toast. Tiket yang ternyata sudah ditutup (409) memuat ulang halaman agar tampil keadaan terbarunya.
 */
export function BalasTiket({ code }: { code: string }) {
  const router = useRouter();
  const [teks, setTeks] = useState("");
  const [galat, setGalat] = useState<string>();
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (sibuk || !teks.trim()) return;
    setSibuk(true);
    const r = await panggil(() => balasTiket(code, teks));
    setSibuk(false);
    if ("error" in r) {
      if (r.error.code === "VALIDATION_ERROR") return setGalat(r.error.fields?.body?.[0] ?? r.error.message);
      toast({ tone: "danger", message: r.error.message });
      if (r.error.code === "TICKET_CLOSED" || r.error.code === "NOT_FOUND") router.refresh();
      return;
    }
    setTeks("");
    setGalat(undefined);
    toast({ tone: "success", message: "Balasan terkirim. Pembeli mendapat notifikasi." });
    router.refresh();
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-3 border-t border-line pt-4">
      <Field label="Balasan untuk pembeli" id={`balas-${code}`} required help={`${teks.length}/${BATAS_BALASAN}`} error={galat}>
        <Textarea value={teks} maxLength={BATAS_BALASAN} rows={4} onChange={(e) => { setTeks(e.target.value); setGalat(undefined); }} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={!teks.trim()} loading={sibuk} loadingText="Mengirim…">Kirim balasan</Button>
      </div>
    </form>
  );
}
