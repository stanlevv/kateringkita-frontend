"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Volume2, VolumeX } from "lucide-react";
import { QuotaPanel } from "@/app/(dashboard)/dashboard/components/QuotaPanel";
import { OrderQueue } from "@/app/(dashboard)/dashboard/components/OrderQueue";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { useStoreStatus } from "@/app/components/shell/StoreStatus";
import { useUbahStatusDapur } from "@/app/components/shell/StoreStatusToggle";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { IconButton } from "@/app/components/ui/IconButton";
import { fokus } from "@/app/components/ui/cx";
import { ganti, pangkasOptimis, ringkasHariIni, terapkanOptimis, terapkanWaktu, type Optimis } from "@/lib/dashboard";
import { diLuarJamBuka, labelJamBuka, perluTindakan } from "@/lib/shell";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { KpiRow } from "./KpiRow";
import { SetupChecklist } from "./SetupChecklist";
import { SyncBanner } from "./SyncBanner";
import { GagalMuat } from "@/app/components/GagalMuat";
import { useLangsung } from "@/hooks/useLangsung";
import { useNotifikasi } from "@/hooks/useNotifikasi";

const TABLET = "(min-width: 768px) and (max-width: 1279px)";
const adaMedia = () => typeof window.matchMedia === "function";
const langganTablet = (f: () => void) => {
  if (!adaMedia()) return () => {};
  const m = window.matchMedia(TABLET);
  m.addEventListener("change", f);
  return () => m.removeEventListener("change", f);
};

export type DataDashboard = {
  orders: MerchantOrder[];
  menus: MerchantMenu[];
  adaTitikTemu: boolean;
  /** Waktu server saat data dirender (ms); dasar "Diperbarui N detik lalu" dan "data terakhir HH.MM". */
  dimuat: number;
};

/**
 * Dashboard live v3 (brief §3–§7, DB-*). Menyimpan data baik terakhir: galat saat polling tidak
 * mengganti antrean (banner DB-E5); galat tanpa data sama sekali -> G-1 gagal muat.
 */
export function DashboardLive({ data, galat }: { data: DataDashboard | null; galat: boolean }) {
  const [terakhir, setTerakhir] = useState(data);
  if (data && data !== terakhir) setTerakhir(data);
  const tampil = data ?? terakhir;
  if (!tampil) return <PageHeader title="Dashboard"><GagalMuat /></PageHeader>;
  return <Isi {...tampil} galat={galat} />;
}

function Isi({ orders: awalOrders, menus: awalMenus, adaTitikTemu, dimuat, galat }: DataDashboard & { galat: boolean }) {
  const { orders, menus, terakhir, putus: terputus, selisih, terima, terimaMenu, segarkan } = useLangsung({ orders: awalOrders, menus: awalMenus, dimuat });
  const { isOpen, buka, tutup } = useStoreStatus();
  const { ubah: ubahDapur, pending: membuka } = useUbahStatusDapur();
  const [sekarang, setSekarang] = useState(dimuat);
  useEffect(() => {
    const i = setInterval(() => setSekarang(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const router = useRouter();
  const [optimis, setOptimis] = useState<Optimis>({});
  const [dariOrders, setDariOrders] = useState(orders);
  if (orders !== dariOrders) {
    setDariOrders(orders);
    setOptimis((o) => pangkasOptimis(orders, o)); // entri yang sudah digantikan data server dibuang
  }
  // DB-E5: galat halaman (refresh gagal) tampil sampai penyegaran sukses berikutnya, tidak menetap.
  const [galatSaat, setGalatSaat] = useState<number | null>(galat ? terakhir : null);
  if (galat && galatSaat === null) setGalatSaat(terakhir);
  if (!galat && galatSaat !== null) setGalatSaat(null);
  const putus = terputus || (galatSaat !== null && galatSaat === terakhir);
  const lokal = Math.max(sekarang, dimuat);
  const kini = lokal + selisih; // D8: jam server (timer tahan, "hari ini")
  const { baru, umumkan, suara, setSuara } = useNotifikasi(orders, dimuat, kini);

  // D11: badge sidebar dihitung di layout server; segarkan halaman hanya saat angkanya berubah.
  const tindakan = perluTindakan(orders);
  const tindakanLalu = useRef(tindakan);
  useEffect(() => {
    if (tindakanLalu.current === tindakan) return;
    tindakanLalu.current = tindakan;
    router.refresh();
  }, [tindakan, router]);
  const tablet = useSyncExternalStore(langganTablet, () => adaMedia() && window.matchMedia(TABLET).matches, () => false);

  const efektif = terapkanWaktu(terapkanOptimis(orders, optimis), kini);
  const ringkasan = ringkasHariIni(efektif, menus, kini);

  function fokusKuota(menuId?: number) {
    // Setelah tab Kuota (tablet) dirender.
    requestAnimationFrame(() => {
      const el = (menuId && document.querySelector<HTMLElement>(`#kuota-${menuId} input`)) || document.getElementById("panel-kuota");
      el?.focus();
    });
  }

  const panel = (
    <>
      <QuotaPanel menus={menus} sekarang={lokal} terakhir={terakhir} onBerubah={(m) => { terimaMenu(m); segarkan(); }} />
      <section aria-labelledby="judul-terlaris" className="rounded-lg border border-line bg-surface p-4">
        <h2 id="judul-terlaris" className="flex items-center gap-2 text-lg font-semibold text-ink"><Trophy aria-hidden className="size-5 text-primary" />Menu terlaris hari ini</h2>
        <p className="mt-2 text-ink">
          {ringkasan.terlaris ? <><span className="font-medium">{ringkasan.terlaris.name}</span> <span className="text-ink-muted">· {ringkasan.terlaris.portions} porsi</span></> : <span className="text-ink-muted">Belum ada penjualan hari ini.</span>}
        </p>
      </section>
    </>
  );

  return (
    <PageHeader
      title="Dashboard"
      description="Antrean pesanan dan kuota hari ini"
      actions={<IconButton icon={suara ? Volume2 : VolumeX} label="Suara notifikasi" aria-pressed={suara} onClick={() => setSuara(!suara)} />}
    >
      <div className="flex flex-col gap-4">
        <p className="sr-only" aria-live="polite">{umumkan}</p>
        {putus && <SyncBanner terakhir={terakhir} />}
        {!isOpen && (
          <Banner tone="warning" action={<Button loading={membuka} onClick={() => ubahDapur(true)}>Buka sekarang</Button>}>
            Dapur tutup — pembeli tidak bisa memesan
          </Banner>
        )}
        {diLuarJamBuka(kini, buka, tutup) && (
          <Banner tone="info" action={<Link href="/pengaturan" className={`inline-flex min-h-11 items-center font-medium underline underline-offset-4 ${fokus}`}>Ubah jam buka</Link>}>
            Di luar jam buka ({labelJamBuka(buka, tutup)})
          </Banner>
        )}
        {(!adaTitikTemu || menus.length === 0) && (
          <SetupChecklist adaTitikTemu={adaTitikTemu} adaMenu={menus.length > 0} dapurBuka={isOpen} membuka={membuka} onBukaDapur={() => ubahDapur(true)} />
        )}
        <KpiRow ringkasan={ringkasan} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <OrderQueue orders={efektif} menus={menus} sekarang={kini} baru={baru} optimis={optimis}
            onOptimis={(c, v) => setOptimis((o) => ganti(o, c, v))} onFokusKuota={fokusKuota} onTerima={terima} onSegarkan={segarkan} kuota={tablet ? <div className="flex flex-col gap-4">{panel}</div> : undefined} />
          {!tablet && <aside aria-label="Kuota dan menu terlaris" className="flex flex-col gap-4">{panel}</aside>}
        </div>
      </div>
    </PageHeader>
  );
}
