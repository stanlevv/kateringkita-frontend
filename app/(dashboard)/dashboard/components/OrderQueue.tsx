// Komponen OrderQueue: antrean pesanan dashboard dalam tab (Perlu tindakan, Dimasak, Siap diambil, Semua hari ini)
// beserta aksi per kartu, dialog tolak, laci slip, dan dialog stok. Dipakai DashboardLive.
// Status pesanan: holding = menunggu konfirmasi (atau menunggu pembayaran online), confirmed = dikonfirmasi,
// cooking = dimasak, ready = siap diambil/diantar, completed = selesai, cancelled = dibatalkan, expired = kadaluarsa.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state, efek, atau router.
"use client";

import { useRef, useState, type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { orderAction } from "@/app/actions/orders";
import { callAction } from "@/lib/action";
import { Button } from "@/app/components/ui/Button";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Tabs } from "@/app/components/ui/Tabs";
import { dismissToast, toast } from "@/app/components/ui/Toast";
import {
  queueForTab,
  setOrDeleteKey,
  countQueueTabs,
  holdSecondsLeft,
  type OptimisticActions,
  type QueueTab,
} from "@/lib/dashboard";
import { nextStatus, actionTexts, successText, type OrderAction } from "@/lib/order-status";
import type { MerchantMenu } from "@/types/menu";
import type { MerchantOrder } from "@/types/order";
import { actionErrorView, OutOfStockDialog } from "@/app/components/orders/OrderActionParts";
import { OrderCard } from "./OrderCard";
import { OrderSlipDrawer } from "./OrderSlipDrawer";
import { RejectDialog } from "@/app/components/orders/RejectDialog";
import { useDeferredAction } from "@/hooks/useDeferredAction";

/** Label tab antrean; kuncinya juga id tab (nilai QueueTab dari lib/dashboard). */
const TAB_LABELS: Record<QueueTab, string> = {
  tindakan: "Perlu tindakan",
  dimasak: "Dimasak",
  siap: "Siap diambil",
  semua: "Semua hari ini",
};

type Props = {
  /** Pesanan efektif (data server + perubahan lokal + waktu tahan diterapkan). */
  orders: MerchantOrder[];
  menus: MerchantMenu[];
  now: number;
  newOrderCodes: string[];
  /** Aksi yang sedang tertunda/terkirim; gugur sendiri begitu `updated_at` pesanan dari server berubah. */
  optimisticActions: OptimisticActions;
  /** Pasang (atau hapus bila undefined) entri optimistis satu pesanan. */
  onOptimisticChange: (code: string, entry: OptimisticActions[string] | undefined) => void;
  onFocusQuota: (menuId?: number) => void;
  /** Meneruskan pesanan terbaru dari respons aksi supaya langsung disatukan ke antrean live. */
  onReceiveOrder: (order: MerchantOrder) => void;
  /** Sinkron antrean sekarang (setelah aksi atau saat status sudah berubah). */
  onRefresh: () => void;
  /** Lebar 768–1279 px (tablet): panel kuota menjadi tab "Kuota" di samping tab antrean. */
  quotaPanel?: ReactNode;
};

/** Aksi yang ditunda; `order` = pesanan saat aksi dipilih (untuk dialog stok dan dasar entri optimistis). */
type PendingAction = { action: OrderAction; order: MerchantOrder };

const SEND_NOW_SECONDS = 5; // sisa tahan sependek ini tidak memberi jendela Batalkan

/**
 * Antrean pesanan dengan tab. Aksi kartu dijalankan optimistis (kartu langsung pindah status) lalu dikirim setelah
 * 5 detik kecuali penjual menekan Batalkan di toast.
 * @param props.orders pesanan efektif (data server + aksi optimistis + waktu tahan diterapkan)
 * @param props.menus daftar menu (untuk mencari menu yang kuotanya kurang)
 * @param props.now jam server sekarang (ms), dasar timer tahan
 * @param props.newOrderCodes kode pesanan baru yang disorot
 * @param props.optimisticActions aksi optimistis yang sedang berlaku
 * @param props.onOptimisticChange memasang atau menghapus aksi optimistis satu pesanan
 * @param props.onFocusQuota memindahkan fokus ke isian kuota (opsional satu menu)
 * @param props.onReceiveOrder menerima pesanan terbaru dari respons aksi
 * @param props.onRefresh meminta sinkron antrean sekarang
 * @param props.quotaPanel isi tab "Kuota" (hanya di tablet)
 * @returns elemen `section`
 */
export function OrderQueue({
  orders,
  menus,
  now,
  newOrderCodes,
  onOptimisticChange,
  onFocusQuota,
  onReceiveOrder,
  onRefresh,
  quotaPanel,
}: Props) {
  // 1. State: tab aktif, pesanan yang sedang ditolak/dilihat slipnya/kurang stok, dan aksi yang sedang dikirim.
  const [tab, setTab] = useState<string>("tindakan");
  const [rejectCode, setRejectCode] = useState<string | null>(null);
  const [slipCode, setSlipCode] = useState<string | null>(null);
  const [outOfStockOrder, setOutOfStockOrder] = useState<MerchantOrder | null>(null);
  const [sending, setSending] = useState<Record<string, OrderAction>>({});
  const actionToasts = useRef(new Map<string, number>());

  /**
   * Mengirim aksi ke server.
   * @returns true bila berhasil
   */
  async function sendAction(code: string, pendingAction: PendingAction, reason?: string) {
    // 1. Tandai kartu sedang mengirim, lalu panggil server action.
    setSending((previous) => ({ ...previous, [code]: pendingAction.action }));
    const result = await callAction(() => orderAction(code, pendingAction.action, reason));
    setSending((previous) => setOrDeleteKey(previous, code, undefined));
    // 2. Berhasil: teruskan pesanan terbaru dan minta sinkron segera.
    if ("data" in result) {
      onOptimisticChange(code, { action: pendingAction.action, baseUpdatedAt: pendingAction.order.updated_at }); // gugur saat baris respons (updated_at baru) disatukan
      onReceiveOrder(result.data);
      onRefresh();
      return true;
    }
    // 3. Gagal: batalkan tampilan optimistis lalu tampilkan galat (dialog stok atau toast).
    onOptimisticChange(code, undefined); // kartu kembali ke tab semula
    const errorView = actionErrorView(result.error.code, pendingAction.action, result.error.message);
    if (errorView.kind === "outOfStock") setOutOfStockOrder(pendingAction.order);
    else {
      toast({ tone: errorView.tone, message: errorView.message });
      if (errorView.reload) onRefresh();
    }
    return false;
  }

  // 2. Aksi tertunda 5 detik (useDeferredAction); saat waktunya tiba, toast Batalkan ditutup dan aksi dikirim.
  const { schedule, undo, pending } = useDeferredAction<PendingAction>((code, pendingAction) => {
    const id = actionToasts.current.get(code);
    if (id) dismissToast(id); // Batalkan tidak berlaku lagi setelah terkirim
    actionToasts.current.delete(code);
    void sendAction(code, pendingAction);
  }, 5000);

  /** Kartu langsung pindah ke status tujuan (optimistis); aksi dikirim sekali setelah 5 detik kecuali dibatalkan. */
  function startAction(order: MerchantOrder, action: OrderAction) {
    // 1. Aksi tidak berlaku lagi untuk status sekarang: beri tahu dan sinkronkan.
    const next = nextStatus(order, action);
    if ("error" in next) {
      toast({ tone: "warning", message: "Pesanan sudah berubah status" });
      onRefresh();
      return;
    }
    // 2. Pindahkan kartu secara optimistis.
    const pendingAction: PendingAction = { action, order };
    onOptimisticChange(order.code, { action, baseUpdatedAt: order.updated_at });
    const message = `Pesanan ${order.code} ${successText(action, order)}`;
    // 3. Waktu tahan hampir habis: kirim konfirmasi langsung tanpa jendela Batalkan.
    const secondsLeft = holdSecondsLeft(order, now);
    if (action === "confirm" && secondsLeft !== null && secondsLeft <= SEND_NOW_SECONDS) {
      void sendAction(order.code, pendingAction).then((ok) => ok && toast({ tone: "success", message }));
      return;
    }
    // 4. Selain itu: jadwalkan pengiriman dan tampilkan toast dengan tombol Batalkan.
    schedule(order.code, pendingAction);
    actionToasts.current.set(
      order.code,
      toast({
        tone: "success",
        message,
        duration: 5000,
        action: { label: "Batalkan", onClick: () => undo(order.code) && onOptimisticChange(order.code, undefined) },
      }),
    );
  }

  /** Mengirim tolak pesanan dengan alasan dari dialog (langsung, tanpa jendela Batalkan). */
  async function confirmReject(reason: string) {
    const code = rejectCode!;
    setRejectCode(null);
    const order = orders.find((candidate) => candidate.code === code);
    if (order && (await sendAction(code, { action: "reject", order }, reason))) {
      toast({ tone: "success", message: `Pesanan ${code} ${actionTexts.reject.success}` });
    }
  }

  /** Membuka tab Kuota (di tablet) lalu memfokuskan isian kuota. */
  function focusQuota(menuId?: number) {
    if (quotaPanel) setTab("kuota");
    onFocusQuota(menuId);
  }

  /** Dari dialog stok: fokus ke kuota menu pertama yang tidak cukup. */
  function addQuotaForStock() {
    const order = outOfStockOrder!;
    const shortItem =
      order.items.find((item) => (menus.find((menu) => menu.id === item.menu_id)?.available ?? 0) < item.qty) ??
      order.items[0];
    setOutOfStockOrder(null);
    focusQuota(shortItem.menu_id);
  }

  // 3. Hitung isi tiap tab dan daftar pesanan untuk tab aktif.
  const tabCounts = countQueueTabs(orders);
  const activeTab = tab === "kuota" && !quotaPanel ? "tindakan" : tab;
  const tabs = [
    ...(Object.keys(TAB_LABELS) as QueueTab[]).map((id) => ({ id, label: TAB_LABELS[id], count: tabCounts[id] })),
    ...(quotaPanel ? [{ id: "kuota", label: "Kuota" }] : []),
  ];
  const visibleOrders = activeTab === "kuota" ? [] : queueForTab(orders, activeTab as QueueTab, now);
  const queueEmpty = tabCounts.tindakan + tabCounts.dimasak + tabCounts.siap === 0 && visibleOrders.length === 0;
  const slipOrder = orders.find((order) => order.code === slipCode) ?? null;

  return (
    <section aria-label="Antrean pesanan" className="flex flex-col gap-4">
      <Tabs tabs={tabs} value={activeTab} onChange={setTab} label="Antrean pesanan" />
      <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "kuota" ? (
          quotaPanel
        ) : queueEmpty ? (
          <EmptyState
            icon={Inbox}
            title="Belum ada pesanan"
            body="Pastikan status dapur Buka dan menu punya kuota."
            action={
              <Button variant="secondary" onClick={() => focusQuota()}>
                Atur kuota
              </Button>
            }
          />
        ) : visibleOrders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-ink-muted">
            Tidak ada pesanan di tab ini.
          </p>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-2">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.code}
                order={order}
                holdSecondsLeft={holdSecondsLeft(order, now)}
                now={now}
                isNew={newOrderCodes.includes(order.code)}
                pending={pending[order.code]?.action ?? sending[order.code]}
                onAction={(action) => startAction(order, action)}
                onReject={() => setRejectCode(order.code)}
                onSlip={() => setSlipCode(order.code)}
              />
            ))}
          </div>
        )}
      </div>

      <RejectDialog
        order={orders.find((order) => order.code === rejectCode) ?? null}
        onClose={() => setRejectCode(null)}
        onConfirm={confirmReject}
      />
      <OrderSlipDrawer order={slipOrder} onClose={() => setSlipCode(null)} />
      <OutOfStockDialog
        code={outOfStockOrder?.code ?? null}
        onClose={() => setOutOfStockOrder(null)}
        onReject={() => {
          const code = outOfStockOrder!.code;
          setOutOfStockOrder(null);
          setRejectCode(code);
        }}
        onAddQuota={addQuotaForStock}
      />
    </section>
  );
}
