"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Volume2, VolumeX } from "lucide-react";
import { QuotaPanel } from "@/app/(dashboard)/dashboard/components/QuotaPanel";
import { OrderQueue } from "@/app/(dashboard)/dashboard/components/OrderQueue";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { useStoreStatus } from "@/app/components/shell/StoreStatus";
import { useStoreOpenToggle } from "@/app/components/shell/StoreStatusToggle";
import { Banner } from "@/app/components/ui/Banner";
import { Button } from "@/app/components/ui/Button";
import { IconButton } from "@/app/components/ui/IconButton";
import { focusRing } from "@/app/components/ui/cx";
import {
  setOrDeleteKey,
  pruneOptimisticActions,
  summarizeToday,
  applyOptimisticActions,
  applyHoldExpiry,
  type OptimisticActions,
} from "@/lib/dashboard";
import { isOutsideOpenHours, openHoursLabel, countNeedsAction } from "@/lib/shell";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { KpiRow } from "./KpiRow";
import { SetupChecklist } from "./SetupChecklist";
import { SyncBanner } from "./SyncBanner";
import { LoadError } from "@/app/components/LoadError";
import { useLiveDashboard } from "@/hooks/useLiveDashboard";
import { useNotifications } from "@/hooks/useNotifications";

const TABLET_QUERY = "(min-width: 768px) and (max-width: 1279px)";
const hasMatchMedia = () => typeof window.matchMedia === "function";
const subscribeTablet = (onChange: () => void) => {
  if (!hasMatchMedia()) return () => {};
  const query = window.matchMedia(TABLET_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export type DashboardData = {
  orders: MerchantOrder[];
  menus: MerchantMenu[];
  hasPickupPoints: boolean;
  /** Waktu server saat data dirender (ms); dasar "Diperbarui N detik lalu" dan "data terakhir HH.MM". */
  loadedAt: number;
};

/**
 * Dashboard live v3 (brief §3–§7, DB-*). Menyimpan data baik terakhir: galat saat polling tidak
 * mengganti antrean (banner DB-E5); galat tanpa data sama sekali -> G-1 gagal muat.
 */
export function DashboardLive({ data, loadFailed }: { data: DashboardData | null; loadFailed: boolean }) {
  const [lastData, setLastData] = useState(data);
  if (data && data !== lastData) setLastData(data);
  const shownData = data ?? lastData;
  if (!shownData)
    return (
      <PageHeader title="Dashboard">
        <LoadError />
      </PageHeader>
    );
  return <DashboardContent {...shownData} loadFailed={loadFailed} />;
}

function DashboardContent({
  orders: initialOrders,
  menus: initialMenus,
  hasPickupPoints,
  loadedAt,
  loadFailed,
}: DashboardData & { loadFailed: boolean }) {
  const { orders, menus, lastSyncedAt, disconnected, clockOffset, receiveOrder, receiveMenu, refresh } =
    useLiveDashboard({ orders: initialOrders, menus: initialMenus, loadedAt });
  const { isOpen, openTime, closeTime } = useStoreStatus();
  const { changeStoreOpen, pending: storeOpenPending } = useStoreOpenToggle();
  const [now, setNow] = useState(loadedAt);
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);
  const router = useRouter();
  const [optimisticActions, setOptimisticActions] = useState<OptimisticActions>({});
  const [seenOrders, setSeenOrders] = useState(orders);
  if (orders !== seenOrders) {
    setSeenOrders(orders);
    setOptimisticActions((previous) => pruneOptimisticActions(orders, previous)); // entri yang sudah digantikan data server dibuang
  }
  // DB-E5: galat halaman (refresh gagal) tampil sampai penyegaran sukses berikutnya, tidak menetap.
  const [loadFailedAt, setLoadFailedAt] = useState<number | null>(loadFailed ? lastSyncedAt : null);
  if (loadFailed && loadFailedAt === null) setLoadFailedAt(lastSyncedAt);
  if (!loadFailed && loadFailedAt !== null) setLoadFailedAt(null);
  const connectionLost = disconnected || (loadFailedAt !== null && loadFailedAt === lastSyncedAt);
  const localNow = Math.max(now, loadedAt);
  const serverNow = localNow + clockOffset; // D8: jam server (timer tahan, "hari ini")
  const { newOrderCodes, announcement, soundOn, setSoundOn } = useNotifications(orders, loadedAt, serverNow);

  // D11: badge sidebar dihitung di layout server; segarkan halaman hanya saat angkanya berubah.
  const needsAction = countNeedsAction(orders);
  const previousNeedsAction = useRef(needsAction);
  useEffect(() => {
    if (previousNeedsAction.current === needsAction) return;
    previousNeedsAction.current = needsAction;
    router.refresh();
  }, [needsAction, router]);
  const isTablet = useSyncExternalStore(
    subscribeTablet,
    () => hasMatchMedia() && window.matchMedia(TABLET_QUERY).matches,
    () => false,
  );

  const effectiveOrders = applyHoldExpiry(applyOptimisticActions(orders, optimisticActions), serverNow);
  const summary = summarizeToday(effectiveOrders, menus, serverNow);

  function focusQuota(menuId?: number) {
    // Setelah tab Kuota (tablet) dirender.
    requestAnimationFrame(() => {
      const target =
        (menuId && document.querySelector<HTMLElement>(`#kuota-${menuId} input`)) ||
        document.getElementById("panel-kuota");
      target?.focus();
    });
  }

  const sidePanel = (
    <>
      <QuotaPanel
        menus={menus}
        now={localNow}
        lastSyncedAt={lastSyncedAt}
        onMenuSaved={(menu) => {
          receiveMenu(menu);
          refresh();
        }}
      />
      <section aria-labelledby="judul-terlaris" className="rounded-lg border border-line bg-surface p-4">
        <h2 id="judul-terlaris" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Trophy aria-hidden className="size-5 text-primary" />
          Menu terlaris hari ini
        </h2>
        <p className="mt-2 text-ink">
          {summary.bestSeller ? (
            <>
              <span className="font-medium">{summary.bestSeller.name}</span>{" "}
              <span className="text-ink-muted">· {summary.bestSeller.portions} porsi</span>
            </>
          ) : (
            <span className="text-ink-muted">Belum ada penjualan hari ini.</span>
          )}
        </p>
      </section>
    </>
  );

  return (
    <PageHeader
      title="Dashboard"
      description="Antrean pesanan dan kuota hari ini"
      actions={
        <IconButton
          icon={soundOn ? Volume2 : VolumeX}
          label="Suara notifikasi"
          aria-pressed={soundOn}
          onClick={() => setSoundOn(!soundOn)}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
        {connectionLost && <SyncBanner lastSyncedAt={lastSyncedAt} />}
        {!isOpen && (
          <Banner
            tone="warning"
            action={
              <Button loading={storeOpenPending} onClick={() => changeStoreOpen(true)}>
                Buka sekarang
              </Button>
            }
          >
            Dapur tutup — pembeli tidak bisa memesan
          </Banner>
        )}
        {isOutsideOpenHours(serverNow, openTime, closeTime) && (
          <Banner
            tone="info"
            action={
              <Link
                href="/pengaturan"
                className={`inline-flex min-h-11 items-center font-medium underline underline-offset-4 ${focusRing}`}
              >
                Ubah jam buka
              </Link>
            }
          >
            {`Di luar jam buka (${openHoursLabel(openTime, closeTime)}) — pembeli belum bisa memesan sampai ${openTime.replace(":", ".")}`}
          </Banner>
        )}
        {(!hasPickupPoints || menus.length === 0) && (
          <SetupChecklist
            hasPickupPoints={hasPickupPoints}
            hasMenus={menus.length > 0}
            storeOpen={isOpen}
            opening={storeOpenPending}
            onOpenStore={() => changeStoreOpen(true)}
          />
        )}
        <KpiRow summary={summary} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <OrderQueue
            orders={effectiveOrders}
            menus={menus}
            now={serverNow}
            newOrderCodes={newOrderCodes}
            optimisticActions={optimisticActions}
            onOptimisticChange={(code, entry) =>
              setOptimisticActions((previous) => setOrDeleteKey(previous, code, entry))
            }
            onFocusQuota={focusQuota}
            onReceiveOrder={receiveOrder}
            onRefresh={refresh}
            quotaPanel={isTablet ? <div className="flex flex-col gap-4">{sidePanel}</div> : undefined}
          />
          {!isTablet && (
            <aside aria-label="Kuota dan menu terlaris" className="flex flex-col gap-4">
              {sidePanel}
            </aside>
          )}
        </div>
      </div>
    </PageHeader>
  );
}
