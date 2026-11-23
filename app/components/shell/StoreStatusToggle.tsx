// Saklar status dapur (buka/tutup) dan hook untuk mengubahnya. Dipakai Sidebar, MobileNav, dan banner DashboardLive.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state atau event.
"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { setStoreOpen } from "@/app/actions/store";
import { callAction } from "@/lib/action";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Switch } from "@/app/components/ui/Switch";
import { toast } from "@/app/components/ui/Toast";
import { cx } from "@/app/components/ui/cx";
import { isOutsideOpenHours, openHoursLabel } from "@/lib/shell";
import { useStoreStatus } from "./StoreStatus";

/**
 * Mengubah status dapur lewat status bersama. Tampilan langsung berubah; bila server gagal, kembali ke status lama
 * dan muncul toast. Dipakai juga oleh banner dashboard.
 * @returns `changeStoreOpen(nextOpen)` dan `pending` (permintaan sedang berjalan)
 */
export function useStoreOpenToggle() {
  const { setIsOpen } = useStoreStatus();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function changeStoreOpen(nextOpen: boolean) {
    // 1. Ubah tampilan dulu, lalu kirim ke server. 2. Gagal: kembalikan + toast; berhasil: muat ulang data server.
    setPending(true);
    setIsOpen(nextOpen);
    const result = await callAction(() => setStoreOpen(nextOpen));
    setPending(false);
    if ("error" in result) {
      setIsOpen(!nextOpen);
      toast({ tone: "danger", message: "Status dapur belum berubah. Coba lagi." });
    } else {
      router.refresh();
    }
  }
  return { changeStoreOpen, pending };
}

/**
 * Saklar status dapur dengan teks Buka/Tutup seperti yang dilihat pembeli. Menutup dapur minta konfirmasi dulu;
 * membuka langsung. Status dibaca dari StoreStatusProvider.
 * @param props.rail hanya saklar kecuali sidebar sedang lebar. Rail = sidebar sempit berisi ikon saja (tablet
 * 768–1279 px). `sb-lebar:` = varian Tailwind yang aktif saat sidebar lebar.
 * @returns elemen `div`
 */
export function StoreStatusToggle({ rail = false }: { rail?: boolean }) {
  // 1. Status bersama dan pengubahnya.
  const { isOpen, openTime, closeTime } = useStoreStatus();
  const { changeStoreOpen, pending } = useStoreOpenToggle();
  const [confirmingClose, setConfirmingClose] = useState(false);

  // 2. Di luar jam buka? Snapshot server = false, jadi HTML server dan klien awal sama; dihitung ulang setelah
  //    hidrasi (saat React di peramban mengambil alih HTML dari server).
  const outsideOpenHours = useSyncExternalStore(
    () => () => {},
    () => isOutsideOpenHours(Date.now(), openTime, closeTime),
    () => false,
  );

  // 3. Status yang dilihat pembeli (aturannya sama dengan backend): saklar menyala DAN di dalam jam buka.
  // Saklar menyala di luar jam = toko buka otomatis saat jam buka tiba.
  const openForCustomers = isOpen && !outsideOpenHours;

  return (
    <div className={cx("flex flex-col gap-1", rail && "items-center sb-lebar:items-stretch")}>
      <div className="flex items-center justify-between gap-2">
        <div className={cx(rail && "hidden sb-lebar:block")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Status dapur</p>
          <p className={cx("text-sm font-semibold", openForCustomers ? "text-success" : "text-ink-muted")}>
            {openForCustomers ? "Buka" : "Tutup"}
          </p>
        </div>
        <Switch
          checked={isOpen}
          disabled={pending}
          label={`Status dapur: ${isOpen ? "Buka" : "Tutup"}`}
          onChange={(nextChecked) => (nextChecked ? changeStoreOpen(true) : setConfirmingClose(true))}
        />
      </div>
      {isOpen && outsideOpenHours && (
        <p className={cx("text-xs text-warning", rail && "hidden sb-lebar:block")}>
          Di luar jam buka ({openHoursLabel(openTime, closeTime)}) · pembeli belum bisa memesan
        </p>
      )}
      <ConfirmDialog
        open={confirmingClose}
        onClose={() => setConfirmingClose(false)}
        title="Tutup dapur?"
        body="Pembeli tidak bisa memesan sampai dibuka lagi."
        confirmLabel="Tutup dapur"
        tone="danger"
        onConfirm={() => {
          setConfirmingClose(false);
          void changeStoreOpen(false);
        }}
      />
    </div>
  );
}
