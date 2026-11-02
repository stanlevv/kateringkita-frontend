"use client";

import { useState } from "react";
import { Pencil, Plus, Power, TicketPercent, Trash2 } from "lucide-react";
import { deletePromo, setPromoActive } from "@/app/actions/promos";
import { panggil } from "@/lib/aksi";
import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PROMO_STATUS, promoStatus, teksJenis } from "@/lib/promo-status";
import type { ActionResult, Promo } from "@/lib/types";
import { PromoForm } from "./PromoForm";

/** PR-N1…N3, PR-S1. Perubahan lokal menang atas data server sampai muat ulang (D2); null = dihapus. */
export function PromoList({ promos, galat, admin, simpan, setAktifAksi }: {
  promos: Promo[]; galat: boolean;
  /** Mode admin (promo platform, D4): tanpa Hapus, kode tidak bisa diubah, aksi simpan/aktif dari admin. */
  admin?: boolean; simpan?: (id: number | null, input: unknown) => Promise<ActionResult<Promo>>; setAktifAksi?: (id: number, aktif: boolean) => Promise<ActionResult<Promo>>;
}) {
  const [lokal, setLokal] = useState<Record<number, Promo | null>>({});
  const [baru, setBaru] = useState<Promo[]>([]);
  const [form, setForm] = useState<"baru" | Promo | null>(null);
  const [hapus, setHapus] = useState<Promo | null>(null);
  const [now] = useState(() => Date.now());

  if (galat) return <GagalMuat judul="Promo belum bisa dimuat" isi="Terjadi kesalahan saat mengambil daftar promo. Periksa koneksi lalu coba lagi." />;

  const daftar = [...baru, ...promos].flatMap((p) => { const x = p.id in lokal ? lokal[p.id] : p; return x ? [x] : []; });
  const buka = () => setForm("baru");

  async function setAktif(p: Promo, aktif: boolean) {
    const pasang = (x: Promo) => setLokal((l) => ({ ...l, [p.id]: x }));
    pasang({ ...p, is_active: aktif });
    const r = await panggil(() => (setAktifAksi ?? setPromoActive)(p.id, aktif));
    if ("error" in r) {
      pasang(p);
      toast({ tone: "danger", message: r.error.message });
      return;
    }
    toast(aktif
      ? { tone: "success", message: "Promo diaktifkan" }
      : { tone: "success", message: "Promo dinonaktifkan", action: { label: "Batalkan", onClick: () => void setAktif({ ...p, is_active: true }, true) } });
  }

  async function hapusPromo(p: Promo) {
    const r = await panggil(() => deletePromo(p.id));
    if ("error" in r) return toast({ tone: "danger", message: r.error.message });
    setLokal((l) => ({ ...l, [p.id]: null }));
    toast({ tone: "success", message: "Promo dihapus" });
  }

  function tersimpan(p: Promo) {
    if (form === "baru") setBaru((b) => [p, ...b]);
    else setLokal((l) => ({ ...l, [p.id]: p }));
    setForm(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {daftar.length === 0 ? (
        <EmptyState icon={TicketPercent} title="Belum ada promo" body="Buat kode promo untuk menarik pembeli"
          action={<Button onClick={buka}><Plus aria-hidden className="size-4" />Buat promo</Button>} />
      ) : (
        <>
          <div><Button onClick={buka}><Plus aria-hidden className="size-4" />Buat promo</Button></div>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {daftar.map((p) => {
              const st = PROMO_STATUS[promoStatus(p, now)];
              return (
                <li key={p.id}>
                  <article aria-label={p.code} className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-lg font-semibold text-ink">{p.code}</p>
                      <Badge tone={st.tone} icon={st.icon}>{st.label}</Badge>
                    </div>
                    {p.description && <p className="text-ink-muted">{p.description}</p>}
                    <p className="font-medium text-ink">{teksJenis(p)}</p>
                    <dl className="grid gap-1 text-sm text-ink-muted">
                      <div><dt className="sr-only">Min belanja</dt><dd>{p.min_subtotal > 0 ? `Min. belanja ${formatRupiah(p.min_subtotal)}` : "Tanpa minimal belanja"}</dd></div>
                      <div><dt className="sr-only">Periode</dt><dd>{formatTanggal(p.starts_at)} – {formatTanggal(p.ends_at)}</dd></div>
                      <div><dt className="sr-only">Pemakaian</dt><dd className="font-mono">{p.quota !== null ? `${p.used_count}/${p.quota}` : p.used_count} terpakai</dd></div>
                    </dl>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      <Button variant="secondary" aria-label={`Ubah ${p.code}`} onClick={() => setForm(p)}><Pencil aria-hidden className="size-4" />Ubah</Button>
                      <Button variant="secondary" aria-label={`${p.is_active ? "Nonaktifkan" : "Aktifkan"} ${p.code}`} onClick={() => void setAktif(p, !p.is_active)}><Power aria-hidden className="size-4" />{p.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
                      {admin ? null : p.used_count === 0 ? (
                        <Button variant="ghost" className="ml-auto text-danger" aria-label={`Hapus ${p.code}`} onClick={() => setHapus(p)}><Trash2 aria-hidden className="size-4" />Hapus</Button>
                      ) : (
                        <p className="text-sm text-ink-muted">Sudah dipakai — nonaktifkan saja</p>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Dialog open={form !== null} onClose={() => setForm(null)} title={form === "baru" ? "Buat promo" : "Ubah promo"} className="max-h-[90dvh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto">
        <PromoForm promo={form === "baru" ? null : form} simpan={simpan} admin={admin} onSaved={tersimpan} onClose={() => setForm(null)} />
      </Dialog>
      <ConfirmDialog open={!!hapus} onClose={() => setHapus(null)} tone="danger" title="Hapus promo?"
        body={`Kode ${hapus?.code ?? ""} akan dihapus dan tidak bisa dipakai lagi.`} confirmLabel="Hapus promo"
        onConfirm={() => { const p = hapus!; setHapus(null); void hapusPromo(p); }} />
    </div>
  );
}
