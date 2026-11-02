"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CircleCheck, Database, PowerOff } from "lucide-react";
import { setAktifMaster, tukarUrutan } from "@/app/actions/admin/master";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Tabs } from "@/components/ui/Tabs";
import { toast } from "@/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { TAB_MASTER } from "@/lib/admin/master";
import type { ItemMaster } from "@/lib/admin/types";
import { urlDengan } from "@/lib/url";
import { MasterForm } from "./MasterForm";

/** A-01…A-03 — data master per tab (tab di URL). Titik temu urut nama; kategori & jenis usaha bisa dinaik-turunkan. */
export function MasterTable({ tabId, rows }: { tabId: string; rows: ItemMaster[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const tab = TAB_MASTER.find((t) => t.id === tabId) ?? TAB_MASTER[0];
  const [form, setForm] = useState<"baru" | ItemMaster | null>(null);
  const [nonaktif, setNonaktif] = useState<ItemMaster | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function aktifkan(i: ItemMaster, aktif: boolean) {
    setSibuk(true);
    const r = await panggil(() => setAktifMaster(tab.kind, i.id, aktif));
    setSibuk(false);
    setNonaktif(null);
    if ("error" in r) return toast({ tone: "danger", message: r.error.message }); // 409: nama toko ikut di pesan
    toast({ tone: "success", message: aktif ? "Diaktifkan" : "Dinonaktifkan" });
    router.refresh();
  }

  async function geser(idx: number, arah: -1 | 1) {
    const a = rows[idx], b = rows[idx + arah];
    let sa = a.sort_order ?? 0, sb = b.sort_order ?? 0;
    // Nilai kembar: tak ada yang bisa ditukar, jadi pakai peringkat daftar (1-based) agar urutan pasti berubah.
    if (sa === sb) { const lo = Math.min(idx, idx + arah); sb = lo + (arah < 0 ? 1 : 2); sa = lo + (arah < 0 ? 2 : 1); } // sb = nilai baru item ini
    setSibuk(true);
    const r = await panggil(() => tukarUrutan(tab.kind, { id: a.id, sort_order: sa }, { id: b.id, sort_order: sb }));
    setSibuk(false);
    if ("error" in r) return toast({ tone: "danger", message: `Urutan belum berubah. ${r.error.message}` });
    router.refresh();
  }

  const kolom: Column<ItemMaster>[] = [
    { key: "name", header: "Nama", cell: (i) => <span className="font-semibold">{i.name}</span> },
    ...(tab.kolom ? [{ key: tab.kolom, header: tab.kolomLabel!, wrap: true, cell: (i: ItemMaster) => i[tab.kolom!] || "-" }] : []),
    { key: "status", header: "Status", cell: (i) => i.is_active
      ? <Badge tone="success" icon={CircleCheck}>Aktif</Badge> : <Badge tone="neutral" icon={PowerOff}>Nonaktif</Badge> },
    { key: "aksi", header: "Aksi", cell: (i) => {
      const idx = rows.indexOf(i);
      return (
        <div className="flex items-center gap-2">
          {tab.urut && (
            <>
              <IconButton icon={ArrowUp} label={`Naikkan ${i.name}`} disabled={sibuk || idx === 0} onClick={() => void geser(idx, -1)} />
              <IconButton icon={ArrowDown} label={`Turunkan ${i.name}`} disabled={sibuk || idx === rows.length - 1} onClick={() => void geser(idx, 1)} />
            </>
          )}
          <Button variant="secondary" aria-label={`Ubah ${i.name}`} onClick={() => setForm(i)}>Ubah</Button>
          {i.is_active
            ? <Button variant="secondary" aria-label={`Nonaktifkan ${i.name}`} onClick={() => setNonaktif(i)}>Nonaktifkan</Button>
            : <Button variant="secondary" aria-label={`Aktifkan ${i.name}`} disabled={sibuk} onClick={() => void aktifkan(i, true)}>Aktifkan</Button>}
        </div>
      );
    } },
  ];

  const tambah = <Button onClick={() => setForm("baru")}>Tambah {tab.satuan}</Button>;
  return (
    <div className="flex flex-col gap-4">
      <Tabs label="Jenis data master" tabs={TAB_MASTER.map((t) => ({ id: t.id, label: t.label }))} value={tab.id}
        onChange={(id) => router.replace(urlDengan(path, params.toString(), { tab: id }, [TAB_MASTER[0].id]), { scroll: false })} />
      {rows.length === 0 ? (
        <EmptyState icon={Database} title={`Belum ada ${tab.satuan}`} body="Tambahkan data pertama agar bisa dipilih penjual." action={tambah} />
      ) : (
        <>
          <div>{tambah}</div>
          <DataTable caption={tab.label} columns={kolom} rows={rows} rowKey={(i) => String(i.id)} />
        </>
      )}
      <Dialog open={form !== null} onClose={() => setForm(null)} title={form === "baru" ? `Tambah ${tab.satuan}` : `Ubah ${tab.satuan}`}>
        <MasterForm key={form === "baru" || form === null ? "baru" : form.id} tab={tab} item={form === "baru" ? null : form} onClose={() => setForm(null)}
          onSaved={() => { setForm(null); router.refresh(); }} />
      </Dialog>
      <ConfirmDialog open={!!nonaktif} onClose={() => setNonaktif(null)} tone="danger" busy={sibuk} title={`Nonaktifkan ${tab.satuan}?`}
        body={`${nonaktif?.name ?? ""} tidak bisa dipilih lagi. Data yang sudah memakainya tidak berubah.`} confirmLabel="Nonaktifkan"
        onConfirm={() => void aktifkan(nonaktif!, false)} />
    </div>
  );
}
