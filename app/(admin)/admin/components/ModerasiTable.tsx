"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, EyeOff, Flag, Star } from "lucide-react";
import { moderasi } from "@/app/actions/admin/moderasi";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { Dialog } from "@/app/components/ui/Dialog";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { AksiModerasi, MenuModerasi, UlasanModerasi } from "@/types/admin";

const TEKS: Record<AksiModerasi, { label: string; judul: string; sukses: string }> = {
  hide: { label: "Sembunyikan", judul: "Sembunyikan ulasan", sukses: "Ulasan disembunyikan." },
  unhide: { label: "Tampilkan lagi", judul: "", sukses: "Ulasan ditampilkan lagi." },
  takedown: { label: "Turunkan", judul: "Turunkan menu", sukses: "Menu diturunkan dari katalog." },
  restore: { label: "Pulihkan", judul: "", sukses: "Menu dipulihkan. Penjual bisa mengaktifkannya lagi." },
};

function Status({ dimoderasi, alasan, label }: { dimoderasi: boolean; alasan: string | null; label: [string, string] }) {
  return dimoderasi ? (
    <span className="flex flex-col gap-1">
      <Badge tone="danger" icon={EyeOff}>{label[1]}</Badge>
      {alasan && <span className="text-sm text-ink-muted">{alasan}</span>}
    </span>
  ) : (
    <Badge tone="success" icon={CheckCircle2}>{label[0]}</Badge>
  );
}

/** F19 — daftar ulasan atau menu dengan aksi moderasi; alasan wajib untuk sembunyikan/turunkan. */
export function ModerasiTable(props: { jenis: "ulasan"; rows: UlasanModerasi[] } | { jenis: "menu"; rows: MenuModerasi[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ id: number; aksi: AksiModerasi } | null>(null);
  const [alasan, setAlasan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  async function kirim(id: number, aksi: AksiModerasi, teks?: string) {
    if (sibuk) return;
    setSibuk(true);
    const r = await panggil(() => moderasi(id, aksi, teks));
    setSibuk(false);
    if ("error" in r) return toast({ tone: "danger", message: r.error.message });
    setDialog(null);
    setAlasan("");
    toast({ tone: "success", message: TEKS[aksi].sukses });
    router.refresh();
  }

  const tombol = (id: number, aksi: AksiModerasi) => (
    <Button variant={aksi === "hide" || aksi === "takedown" ? "danger" : "secondary"} disabled={sibuk}
      onClick={() => (aksi === "hide" || aksi === "takedown" ? setDialog({ id, aksi }) : void kirim(id, aksi))}>
      {TEKS[aksi].label}
    </Button>
  );

  if (props.rows.length === 0) {
    return <EmptyState icon={Flag} title="Tidak ada data" body="Belum ada data yang cocok dengan filter ini." />;
  }

  const tabel = props.jenis === "ulasan" ? (
    <DataTable<UlasanModerasi> caption="Ulasan pembeli" rows={props.rows} rowKey={(u) => String(u.id)} columns={[
      { key: "menu", header: "Menu", cell: (u) => <span className="flex flex-col"><span className="font-medium">{u.menu.name}</span><span className="text-sm text-ink-muted">{u.merchant.business_name}</span></span> },
      { key: "rating", header: "Rating", cell: (u) => <span className="inline-flex items-center gap-1"><Star aria-hidden className="size-4" />{u.rating}</span> },
      { key: "komentar", header: "Komentar", wrap: true, cell: (u) => u.comment ?? "—" },
      { key: "pembeli", header: "Pembeli", cell: (u) => <span className="flex flex-col"><span>{u.customer_name}</span><span className="font-mono text-sm text-ink-muted">{u.order_code}</span></span> },
      { key: "tanggal", header: "Tanggal", cell: (u) => formatTanggal(u.created_at) },
      { key: "status", header: "Status", cell: (u) => <Status dimoderasi={u.hidden} alasan={u.hidden_reason} label={["Tampil", "Disembunyikan"]} /> },
      { key: "aksi", header: "Aksi", cell: (u) => tombol(u.id, u.hidden ? "unhide" : "hide") },
    ] satisfies Column<UlasanModerasi>[]} />
  ) : (
    <DataTable<MenuModerasi> caption="Menu" rows={props.rows} rowKey={(m) => String(m.id)} columns={[
      { key: "menu", header: "Menu", cell: (m) => <span className="font-medium">{m.name}</span> },
      { key: "toko", header: "Toko", cell: (m) => m.merchant.business_name },
      { key: "harga", header: "Harga", align: "right", cell: (m) => formatRupiah(m.price) },
      { key: "aktif", header: "Dijual", cell: (m) => (m.is_active ? "Ya" : "Tidak") },
      { key: "status", header: "Status", cell: (m) => <Status dimoderasi={m.moderated} alasan={m.moderation_reason} label={["Normal", "Diturunkan"]} /> },
      { key: "aksi", header: "Aksi", cell: (m) => tombol(m.id, m.moderated ? "restore" : "takedown") },
    ] satisfies Column<MenuModerasi>[]} />
  );

  return (
    <>
      {tabel}
      <Dialog open={dialog !== null} onClose={() => setDialog(null)} title={dialog ? TEKS[dialog.aksi].judul : ""}>
        <Field label="Alasan" required help={`${alasan.length}/500`}>
          <Textarea autoFocus value={alasan} maxLength={500} onChange={(e) => setAlasan(e.target.value)} />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDialog(null)}>Batal</Button>
          <Button variant="danger" disabled={!alasan.trim() || sibuk} onClick={() => dialog && kirim(dialog.id, dialog.aksi, alasan.trim())}>
            {dialog ? TEKS[dialog.aksi].label : ""}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
