"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { orderAction } from "@/app/actions/orders";
import { panggil } from "@/lib/aksi";
import { Button } from "@/app/components/ui/Button";
import { PaymentBadge } from "@/app/components/ui/PaymentBadge";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { toast } from "@/app/components/ui/Toast";
import { cx } from "@/app/components/ui/cx";
import { formatJam, formatRupiah, formatTanggal, formatTelepon, tanggalWib } from "@/lib/format";
import { statusView, tampilanStatus, teksAksi, type AksiPesanan } from "@/lib/order-status";
import type { MerchantOrder } from "@/types/order";
import { ChatWaLink, galatAksi, StokDialog, TombolTolak } from "./galatAksi";
import { RejectDialog } from "./RejectDialog";
import { StatusTimeline } from "./StatusTimeline";

const Baris = ({ label, nilai, tebal }: { label: string; nilai: string; tebal?: boolean }) => (
  <div className={cx("flex justify-between gap-3", tebal ? "font-semibold text-ink" : "text-ink-muted")}>
    <dt>{label}</dt>
    <dd className="font-mono">{nilai}</dd>
  </div>
);

const Bagian = ({ judul, children }: { judul: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="font-semibold text-ink">{judul}</h2>
    {children}
  </section>
);

/** Tombol aksi sama dengan OrderCard (statusView), tetapi langsung terkirim tanpa jendela Batalkan. */
function Aksi({ order }: { order: MerchantOrder }) {
  const router = useRouter();
  const [kirim, setKirim] = useState<AksiPesanan | null>(null);
  const [tolak, setTolak] = useState(false);
  const [stok, setStok] = useState(false);
  const v = statusView[tampilanStatus(order)];

  async function jalankan(a: AksiPesanan, reason?: string) {
    setKirim(a);
    const r = await panggil(() => orderAction(order.code, a, reason));
    if ("data" in r) {
      // Tombol tetap terkunci sampai status pada prop berubah (Aksi di-key status); jangan buka kunci di jeda refresh.
      toast({ tone: "success", message: `Pesanan ${order.code} ${teksAksi[a].sukses}` });
    } else {
      setKirim(null);
      const g = galatAksi(r.error.code, a, r.error.message);
      if (g.jenis === "stok") setStok(true);
      else toast({ tone: g.tone, message: g.message });
      if (g.jenis === "stok" || !g.muatUlang) return;
    }
    router.refresh();
  }

  if (!v.primary && !v.secondary.some((s) => s !== "lihat-slip")) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {v.hint && <p className="self-center text-ink-muted">{v.hint}</p>}
      {v.primary && (
        <Button loading={kirim === v.primary} loadingText={teksAksi[v.primary].proses} disabled={!!kirim} onClick={() => void jalankan(v.primary!)}>
          {v.primaryLabel}
        </Button>
      )}
      {v.secondary.includes("reject") && <TombolTolak disabled={!!kirim} onClick={() => setTolak(true)} />}
      {v.secondary.includes("chat-wa") && order.customer_phone && <ChatWaLink code={order.code} />}
      <RejectDialog order={tolak ? order : null} onClose={() => setTolak(false)} onConfirm={(r) => { setTolak(false); void jalankan("reject", r); }} />
      <StokDialog code={stok ? order.code : null} onClose={() => setStok(false)}
        onTolak={() => { setStok(false); setTolak(true); }}
        onTambah={() => router.push(`/menu?q=${encodeURIComponent(order.items[0]?.menu_name ?? "")}`)} />
    </div>
  );
}

/** PS-N2, PS-A1. `aksi={false}` untuk laci slip (dashboard sudah punya aksi di kartu). Selalu memakai prop; aksi sukses memuat ulang halaman. */
export function OrderDetail({ order: o, aksi = true }: { order: MerchantOrder; aksi?: boolean }) {
  const hariPesan = tanggalWib(o.created_at);
  return (
    <div className="flex flex-col gap-6 text-sm text-ink">
      <div className="flex flex-wrap items-center gap-2"><StatusBadge order={o} /><PaymentBadge method={o.payment_method} status={o.payment_status} /></div>

      <Bagian judul="Pemesan">
        <p><span className="font-semibold">{o.customer_name}</span>{o.customer_phone && ` · ${formatTelepon(o.customer_phone)}`}</p>
        <p className="inline-flex items-center gap-1 text-ink-muted"><MapPin aria-hidden className="size-4" />{o.table ? `Meja ${o.table.label} · makan di tempat` : `Titik ambil: ${o.pickup_point?.name}`}</p>
        {!o.table && (
          <p className="text-ink-muted">
            Waktu ambil: {o.pickup_at ? `${tanggalWib(o.pickup_at) === hariPesan ? "" : `${formatTanggal(o.pickup_at)} `}${formatJam(o.pickup_at)}` : "Secepatnya"}
          </p>
        )}
        {o.note && <p className="rounded-md bg-subtle px-3 py-2">“{o.note}”</p>}
      </Bagian>

      <Bagian judul="Pesanan">
        <ul className="flex flex-col gap-2">
          {o.items.map((i) => (
            <li key={`${i.menu_id}-${i.options.map((x) => x.id).join()}`} className="flex justify-between gap-3">
              <span>
                <span className="font-mono">{i.qty}×</span> {i.menu_name}
                {i.options.map((x) => <span key={x.id} className="block text-ink-muted">+{x.name} ({formatRupiah(x.extra_price)})</span>)}
              </span>
              <span className="font-mono">{formatRupiah(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-line pt-3">
          <Baris label="Subtotal" nilai={formatRupiah(o.subtotal)} />
          {o.discount > 0 && <Baris label="Diskon" nilai={`− ${formatRupiah(o.discount)}`} />}
          <Baris label="Biaya layanan" nilai={formatRupiah(o.service_fee)} />
          <Baris label="Total" nilai={formatRupiah(o.total)} tebal />
        </dl>
      </Bagian>

      <Bagian judul="Riwayat status"><StatusTimeline order={o} /></Bagian>

      {aksi && <Aksi key={o.status} order={o} />}
    </div>
  );
}
