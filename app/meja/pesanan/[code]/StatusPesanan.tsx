"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, ChefHat, CircleX, Clock, PartyPopper, Utensils } from "lucide-react";
import { bayarPesananMeja, statusPesananMeja } from "@/app/actions/meja";
import { Button } from "@/app/components/ui/Button";
import { cx, fokus } from "@/app/components/ui/cx";
import { panggil } from "@/lib/aksi";
import { formatRupiah } from "@/lib/format";
import { langganan, tamuMentah, uraiTamu } from "@/lib/meja-simpan";
import type { PesananMeja } from "@/types/meja";
import { MejaPesan } from "../../MejaPesan";

const LANGKAH = [
  { s: "holding", label: "Pembayaran" },
  { s: "confirmed", label: "Diterima toko" },
  { s: "cooking", label: "Sedang dimasak" },
  { s: "ready", label: "Siap diantar" },
  { s: "completed", label: "Selesai" },
] as const;
const URUT: Record<string, number> = { holding: 0, confirmed: 1, cooking: 2, ready: 3, completed: 4 };
const AKHIR = ["completed", "cancelled", "expired"];
const JUDUL: Record<string, { judul: string; isi: string }> = {
  confirmed: { judul: "Pesanan diterima", isi: "Pembayaran lunas. Dapur akan segera memasak pesananmu." },
  cooking: { judul: "Sedang dimasak", isi: "Pesananmu sedang disiapkan dapur." },
  ready: { judul: "Siap!", isi: "Pesananmu segera diantar ke meja." },
  completed: { judul: "Selamat menikmati", isi: "Terima kasih sudah memesan." },
  expired: { judul: "Waktu bayar habis", isi: "Pesanan dibatalkan karena belum dibayar. Silakan pesan lagi." },
  cancelled: { judul: "Pesanan dibatalkan", isi: "Pesanan ini dibatalkan toko. Bila sudah membayar, hubungi kasir untuk pengembalian dana." },
};
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function StatusPesanan({ code }: { code: string }) {
  // undefined = render server; null = pesanan dibuat di perangkat lain
  const mentah = useSyncExternalStore(langganan, () => tamuMentah(code), () => undefined);
  const tamu = useMemo(() => (mentah === undefined ? undefined : uraiTamu(mentah)), [mentah]);
  // kembali dari Midtrans membawa ?transaction_status=...; notifikasi lunas bisa tiba beberapa detik kemudian
  const baruBayar = useSyncExternalStore(langganan, () => /transaction_status=(settlement|capture)/.test(window.location.search), () => false);
  const [d, setD] = useState<PesananMeja | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sisa, setSisa] = useState<number | null>(null);
  const [membayar, setMembayar] = useState(false);
  const akhir = useRef(false);

  const muat = useCallback(async () => {
    if (!tamu || akhir.current) return;
    const r = await panggil(() => statusPesananMeja(code, tamu.tamu));
    if ("error" in r) return setGalat(r.error.message);
    setGalat(null);
    setD(r.data);
    setSisa(r.data.seconds_left);
    akhir.current = AKHIR.includes(r.data.status);
  }, [code, tamu]);

  // pantau tiap 5 detik sampai selesai/batal/kedaluwarsa
  useEffect(() => {
    if (!tamu) return;
    const awal = setTimeout(() => void muat(), 0);
    const t = setInterval(() => void muat(), 5000);
    return () => {
      clearTimeout(awal);
      clearInterval(t);
    };
  }, [tamu, muat]);

  useEffect(() => {
    if (sisa === null || sisa <= 0) return;
    const t = setTimeout(() => setSisa((s) => (s === null ? s : Math.max(s - 1, 0))), 1000);
    return () => clearTimeout(t);
  }, [sisa]);

  async function bayar() {
    if (!tamu || !d) return;
    if (d.payment_url) return window.location.assign(d.payment_url);
    setMembayar(true);
    const r = await panggil(() => bayarPesananMeja(code, tamu.tamu, `${window.location.origin}/meja/pesanan/${code}`));
    if ("data" in r) return window.location.assign(r.data.payment_url);
    setMembayar(false);
    setGalat(r.error.message);
  }

  if (tamu === undefined) return null;
  if (tamu === null) {
    return <MejaPesan judul="Pesanan tidak bisa dibuka di sini" isi="Status pesanan hanya bisa dilihat dari HP yang dipakai memesan. Tanyakan ke kasir bila perlu." />;
  }
  if (!d) {
    return galat
      ? <MejaPesan judul="Pesanan belum bisa dimuat" isi={galat} aksi={<Button onClick={() => void muat()}>Coba lagi</Button>} />
      : <p className="p-8 text-center text-ink-muted">Memuat pesanan…</p>;
  }

  const menunggu = d.status === "holding";
  const info = menunggu
    ? baruBayar
      ? { judul: "Memeriksa pembayaran…", isi: "Pembayaranmu sedang dikonfirmasi. Halaman ini berganti otomatis." }
      : { judul: "Menunggu pembayaran", isi: "Selesaikan pembayaran agar pesanan diteruskan ke dapur." }
    : JUDUL[d.status];
  const gagal = d.status === "expired" || d.status === "cancelled";
  const Ikon = gagal ? CircleX : d.status === "completed" ? PartyPopper : d.status === "ready" ? Utensils : d.status === "cooking" ? ChefHat : menunggu ? Clock : Check;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{d.merchant.business_name}</span>
        <span className="rounded-md border-2 border-dashed border-ink/60 px-2 py-0.5 font-mono font-bold">MEJA {d.table.label}</span>
      </div>

      <section aria-live="polite" className={cx("flex flex-col items-center gap-3 rounded-2xl p-6 text-center", gagal ? "bg-danger-bg" : "bg-gradient-to-br from-accent to-accent-pressed")}>
        <span className="flex size-16 items-center justify-center rounded-full bg-surface"><Ikon aria-hidden className={cx("size-8", gagal ? "text-danger" : "text-primary")} /></span>
        <h1 className="font-display text-2xl font-bold">{info.judul}</h1>
        <p className={gagal ? "text-danger" : "text-ink/80"}>{info.isi}</p>
        {menunggu && sisa !== null && sisa > 0 && !baruBayar && <p className="font-mono text-lg font-bold">Bayar dalam {mmss(sisa)}</p>}
        {menunggu && !baruBayar && (
          <Button size="lg" variant="secondary" className="w-full" loading={membayar} loadingText="Membuka halaman bayar…" onClick={bayar}>
            Bayar {formatRupiah(d.total)}
          </Button>
        )}
      </section>

      {galat && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{galat}</p>}

      {!gagal && (
        <ol className="flex flex-col gap-0">
          {LANGKAH.map((l, i) => {
            const selesai = URUT[d.status] > i || (i === 0 && d.payment_status === "paid");
            const kini = URUT[d.status] === i && !selesai;
            return (
              <li key={l.s} className="flex items-center gap-3 py-1.5">
                <span className={cx("flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  selesai ? "border-success bg-success text-surface" : kini ? "border-accent bg-primary-soft text-primary" : "border-line text-ink-muted")}>
                  {selesai ? <Check aria-hidden className="size-4" /> : i + 1}
                </span>
                <span className={cx(selesai || kini ? "font-semibold text-ink" : "text-ink-muted")}>{l.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-2 font-mono text-xs text-ink-muted">{d.code}</p>
        <ul className="flex flex-col gap-2">
          {d.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 text-sm">
              <span>{it.qty}× {it.menu_name}{it.options.length > 0 && <span className="text-ink-muted"> (+{it.options.map((o) => o.name).join(", ")})</span>}</span>
              <span className="font-mono">{formatRupiah(it.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-line-strong pt-3 text-sm">
          {d.service_fee > 0 && <p className="flex justify-between text-ink-muted"><span>Biaya layanan</span><span className="font-mono">{formatRupiah(d.service_fee)}</span></p>}
          <p className="flex justify-between text-base font-bold"><span>Total</span><span className="font-mono">{formatRupiah(d.total)}</span></p>
        </div>
      </section>

      <Link href={`/meja/${tamu.meja}`} className={cx("inline-flex min-h-11 items-center justify-center rounded-xl border border-line-strong bg-surface font-semibold text-ink hover:bg-subtle", fokus)}>
        {gagal || d.status === "completed" ? "Pesan lagi" : "Tambah pesanan lain"}
      </Link>
    </main>
  );
}
