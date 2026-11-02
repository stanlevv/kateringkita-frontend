"use client";

import { useState } from "react";
import { simpanMaster } from "@/app/actions/admin/master";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { cekMaster, type TAB_MASTER } from "@/lib/admin/master";
import type { ItemMaster } from "@/lib/admin/types";

/** A-01…A-03 — isi dialog tambah/ubah data master. `item` ada = mode ubah. */
export function MasterForm({ tab, item, onSaved, onClose }: { tab: (typeof TAB_MASTER)[number]; item: ItemMaster | null; onSaved: () => void; onClose: () => void }) {
  const kolom = tab.kolom;
  const [name, setName] = useState(item?.name ?? "");
  const [extra, setExtra] = useState((kolom && item?.[kolom]) || "");
  const [dicoba, setDicoba] = useState(false);
  const [server, setServer] = useState<Record<string, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);

  const input = { name, ...(kolom ? { [kolom]: extra } : {}) };
  const lokal = cekMaster(tab.kind, input);
  const galat = (k: string) => (dicoba ? (lokal[k] ?? server[k]) : undefined);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(lokal).length > 0) return setDicoba(true);
    if (menyimpan) return;
    setMenyimpan(true);
    const r = await panggil(() => simpanMaster(tab.kind, item?.id ?? null, input));
    setMenyimpan(false);
    if ("error" in r) {
      if (r.error.code === "CONFLICT") { setServer({ name: r.error.message }); setDicoba(true); }
      else if (r.error.fields) { setServer(Object.fromEntries(Object.entries(r.error.fields).map(([k, m]) => [k, m[0]]))); setDicoba(true); }
      toast({ tone: "danger", message: r.error.message }); // 409 nama kembar: pesan backend apa adanya
      return;
    }
    toast({ tone: "success", message: item ? "Perubahan disimpan" : "Data ditambahkan" });
    onSaved();
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      <Field label="Nama" id="mf-name" required error={galat("name")}>
        <Input value={name} maxLength={tab.nameMax} onChange={(e) => { setServer({}); setName(e.target.value); }} autoFocus />
      </Field>
      {kolom && (
        <Field label={tab.kolomLabel!} id={`mf-${kolom}`} help={kolom === "icon" ? "Nama ikon, boleh dikosongkan." : "Boleh dikosongkan."} error={galat(kolom)}>
          <Input value={extra} maxLength={tab.kolomMax} onChange={(e) => { setServer({}); setExtra(e.target.value); }} />
        </Field>
      )}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Batal</Button>
        <Button type="submit" loading={menyimpan} loadingText="Menyimpan…">Simpan</Button>
      </div>
    </form>
  );
}
