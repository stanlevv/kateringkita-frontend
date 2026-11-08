"use client";

import { useState } from "react";
import { kirimPengumuman, type Penerima } from "@/app/actions/admin/pengumuman";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Field } from "@/app/components/ui/Field";
import { Input, Select, Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";

const LABEL: Record<Penerima, string> = { all: "Semua pembeli dan penjual", customer: "Semua pembeli", merchant: "Semua penjual" };

/** Broadcast pengumuman ke notifikasi aplikasi; dikonfirmasi dulu karena tidak bisa ditarik kembali. */
export function PengumumanForm() {
  const [nilai, setNilai] = useState<{ audience: Penerima; title: string; body: string }>({ audience: "customer", title: "", body: "" });
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  function cek(e: React.FormEvent) {
    e.preventDefault();
    const g: Record<string, string> = {};
    if (!nilai.title.trim()) g.title = "Judul wajib diisi.";
    if (!nilai.body.trim()) g.body = "Isi wajib diisi.";
    setGalat(g);
    if (!Object.keys(g).length) setKonfirmasi(true);
  }

  async function kirim() {
    setSibuk(true);
    const r = await panggil(() => kirimPengumuman(nilai));
    setSibuk(false);
    setKonfirmasi(false);
    if ("error" in r) {
      if (r.error.fields) setGalat(Object.fromEntries(Object.entries(r.error.fields).map(([k, v]) => [k, v[0]])));
      return void toast({ tone: "danger", message: r.error.message });
    }
    toast({ tone: "success", message: `Pengumuman terkirim ke ${r.data.sent} akun.` });
    setNilai((p) => ({ ...p, title: "", body: "" }));
  }

  return (
    <form onSubmit={cek} noValidate aria-label="Kirim pengumuman" className="flex max-w-2xl flex-col gap-4 rounded-lg border border-line bg-surface p-4">
      <Field label="Penerima" id="audience">
        <Select value={nilai.audience} onChange={(e) => setNilai((p) => ({ ...p, audience: e.target.value as Penerima }))}>
          {(Object.keys(LABEL) as Penerima[]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
        </Select>
      </Field>
      <Field label="Judul" id="judul" required error={galat.title} help={`${nilai.title.length}/120`}>
        <Input maxLength={120} value={nilai.title} onChange={(e) => setNilai((p) => ({ ...p, title: e.target.value }))} />
      </Field>
      <Field label="Isi" id="isi" required error={galat.body} help={`${nilai.body.length}/255`}>
        <Textarea rows={3} maxLength={255} value={nilai.body} onChange={(e) => setNilai((p) => ({ ...p, body: e.target.value }))} />
      </Field>
      <Button type="submit" className="self-start">Kirim pengumuman</Button>
      <ConfirmDialog
        open={konfirmasi} onClose={() => setKonfirmasi(false)} title="Kirim pengumuman" tone="primary" confirmLabel="Kirim" busy={sibuk}
        body={`Kirim "${nilai.title.trim()}" ke ${LABEL[nilai.audience].toLowerCase()}? Pengumuman tidak bisa ditarik kembali.`} onConfirm={kirim}
      />
    </form>
  );
}
