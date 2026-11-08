"use client";

import { useRef, useState, type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { orderAction } from "@/app/actions/orders";
import { panggil } from "@/lib/aksi";
import { Button } from "@/app/components/ui/Button";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Tabs } from "@/app/components/ui/Tabs";
import { dismissToast, toast } from "@/app/components/ui/Toast";
import { antrean, ganti, jumlahTab, sisaHold, type Optimis, type TabAntrean } from "@/lib/dashboard";
import { nextStatus, teksAksi, type AksiPesanan } from "@/lib/order-status";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { galatAksi, StokDialog } from "@/app/components/orders/galatAksi";
import { OrderCard } from "./OrderCard";
import { OrderSlipDrawer } from "./OrderSlipDrawer";
import { RejectDialog } from "@/app/components/orders/RejectDialog";
import { useDeferredAction } from "@/hooks/useDeferredAction";

const LABEL: Record<TabAntrean, string> = { tindakan: "Perlu tindakan", dimasak: "Dimasak", siap: "Siap diambil", semua: "Semua hari ini" };

type Props = {
  /** Pesanan efektif (data server + perubahan lokal + waktu tahan diterapkan). */
  orders: MerchantOrder[];
  menus: MerchantMenu[];
  sekarang: number;
  baru: string[];
  /** Aksi yang sedang tertunda/terkirim; gugur sendiri begitu `updated_at` server berubah (D14). */
  optimis: Optimis;
  /** Pasang (atau hapus bila undefined) entri optimistis satu pesanan. */
  onOptimis: (code: string, v: Optimis[string] | undefined) => void;
  onFokusKuota: (menuId?: number) => void;
  /** D10: baris terkini dari respons aksi, disatukan ke antrean live. */
  onTerima: (o: MerchantOrder) => void;
  /** Sinkron antrean sekarang (setelah aksi atau saat status sudah berubah). */
  onSegarkan: () => void;
  /** 768–1279 px: panel kuota jadi tab "Kuota" di samping tab antrean (brief §7). */
  kuota?: ReactNode;
};

/** Aksi yang ditunda; `order` = pesanan saat aksi dipilih (untuk dialog stok dan dasar entri optimistis). */
type Tunda = { aksi: AksiPesanan; order: MerchantOrder };

const KIRIM_LANGSUNG_DETIK = 5; // sisa tahan sependek ini tidak memberi jendela Batalkan

export function OrderQueue({ orders, menus, sekarang, baru, onOptimis, onFokusKuota, onTerima, onSegarkan, kuota }: Props) {
  const [tab, setTab] = useState<string>("tindakan");
  const [tolak, setTolak] = useState<string | null>(null);
  const [slip, setSlip] = useState<string | null>(null);
  const [stok, setStok] = useState<MerchantOrder | null>(null);
  const [kirim, setKirim] = useState<Record<string, AksiPesanan>>({});
  const toastAksi = useRef(new Map<string, number>());

  async function kirimAksi(code: string, t: Tunda, reason?: string) {
    setKirim((k) => ({ ...k, [code]: t.aksi }));
    const r = await panggil(() => orderAction(code, t.aksi, reason));
    setKirim((k) => ganti(k, code, undefined));
    if ("data" in r) {
      onOptimis(code, { aksi: t.aksi, dasar: t.order.updated_at }); // gugur saat baris respons (updated_at baru) disatukan
      onTerima(r.data);
      onSegarkan();
      return true;
    }
    onOptimis(code, undefined); // kartu kembali ke tab semula
    const g = galatAksi(r.error.code, t.aksi, r.error.message);
    if (g.jenis === "stok") setStok(t.order);
    else {
      toast({ tone: g.tone, message: g.message });
      if (g.muatUlang) onSegarkan();
    }
    return false;
  }

  const { schedule, undo, pending } = useDeferredAction<Tunda>((code, t) => {
    const id = toastAksi.current.get(code);
    if (id) dismissToast(id); // Batalkan tidak berlaku lagi setelah terkirim
    toastAksi.current.delete(code);
    void kirimAksi(code, t);
  }, 5000);

  /** DB-A2: kartu langsung pindah ke status tujuan (optimistis); dikirim sekali setelah 5 dtk kecuali dibatalkan. */
  function aksi(o: MerchantOrder, a: AksiPesanan) {
    const hasil = nextStatus(o, a);
    if ("error" in hasil) {
      toast({ tone: "warning", message: "Pesanan sudah berubah status" });
      onSegarkan();
      return;
    }
    const t: Tunda = { aksi: a, order: o };
    onOptimis(o.code, { aksi: a, dasar: o.updated_at });
    const pesan = `Pesanan ${o.code} ${teksAksi[a].sukses}`;
    const sisa = sisaHold(o, sekarang);
    if (a === "confirm" && sisa !== null && sisa <= KIRIM_LANGSUNG_DETIK) {
      void kirimAksi(o.code, t).then((ok) => ok && toast({ tone: "success", message: pesan }));
      return;
    }
    schedule(o.code, t);
    toastAksi.current.set(o.code, toast({ tone: "success", message: pesan, duration: 5000, action: { label: "Batalkan", onClick: () => undo(o.code) && onOptimis(o.code, undefined) } }));
  }

  async function konfirmasiTolak(reason: string) {
    const code = tolak!;
    setTolak(null);
    const o = orders.find((x) => x.code === code);
    if (o && (await kirimAksi(code, { aksi: "reject", order: o }, reason))) {
      toast({ tone: "success", message: `Pesanan ${code} ${teksAksi.reject.sukses}` });
    }
  }

  function fokusKuota(menuId?: number) {
    if (kuota) setTab("kuota");
    onFokusKuota(menuId);
  }

  function tambahKuotaStok() {
    const o = stok!;
    const kurang = o.items.find((i) => (menus.find((m) => m.id === i.menu_id)?.available ?? 0) < i.qty) ?? o.items[0];
    setStok(null);
    fokusKuota(kurang.menu_id);
  }

  const jumlah = jumlahTab(orders);
  const aktif = tab === "kuota" && !kuota ? "tindakan" : tab;
  const tabs = [
    ...(Object.keys(LABEL) as TabAntrean[]).map((id) => ({ id, label: LABEL[id], count: jumlah[id] })),
    ...(kuota ? [{ id: "kuota", label: "Kuota" }] : []),
  ];
  const daftar = aktif === "kuota" ? [] : antrean(orders, aktif as TabAntrean, sekarang);
  const kosong = jumlah.tindakan + jumlah.dimasak + jumlah.siap === 0 && daftar.length === 0;
  const slipOrder = orders.find((o) => o.code === slip) ?? null;

  return (
    <section aria-label="Antrean pesanan" className="flex flex-col gap-4">
      <Tabs tabs={tabs} value={aktif} onChange={setTab} label="Antrean pesanan" />
      <div role="tabpanel" aria-labelledby={`tab-${aktif}`}>
        {aktif === "kuota" ? (
          kuota
        ) : kosong ? (
          <EmptyState icon={Inbox} title="Belum ada pesanan" body="Pastikan status dapur Buka dan menu punya kuota."
            action={<Button variant="secondary" onClick={() => fokusKuota()}>Atur kuota</Button>} />
        ) : daftar.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-ink-muted">Tidak ada pesanan di tab ini.</p>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-2">
            {daftar.map((o) => (
              <OrderCard key={o.code} order={o} sisa={sisaHold(o, sekarang)} sekarang={sekarang} baru={baru.includes(o.code)}
                pending={pending[o.code]?.aksi ?? kirim[o.code]} onAksi={(a) => aksi(o, a)} onTolak={() => setTolak(o.code)} onSlip={() => setSlip(o.code)} />
            ))}
          </div>
        )}
      </div>

      <RejectDialog code={tolak} onClose={() => setTolak(null)} onConfirm={konfirmasiTolak} />
      <OrderSlipDrawer order={slipOrder} onClose={() => setSlip(null)} />
      <StokDialog code={stok?.code ?? null} onClose={() => setStok(null)} onTolak={() => { const c = stok!.code; setStok(null); setTolak(c); }} onTambah={tambahKuotaStok} />
    </section>
  );
}
