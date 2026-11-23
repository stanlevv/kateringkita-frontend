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

/** SH-E1: ubah status dapur lewat status bersama; gagal -> kembali + toast. Dipakai juga oleh banner dashboard. */
export function useStoreOpenToggle() {
  const { setIsOpen } = useStoreStatus();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function changeStoreOpen(nextOpen: boolean) {
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

/** SH-N3 / SH-E1 / SH-A1. `rail`: hanya saklar kecuali sidebar sedang lebar (varian sb-lebar). Status dibaca dari StoreStatusProvider. */
export function StoreStatusToggle({ rail = false }: { rail?: boolean }) {
  const { isOpen, openTime, closeTime } = useStoreStatus();
  const { changeStoreOpen, pending } = useStoreOpenToggle();
  const [confirmingClose, setConfirmingClose] = useState(false);

  // Snapshot server = false, jadi HTML server dan klien awal sama; dihitung ulang setelah hidrasi.
  const outsideOpenHours = useSyncExternalStore(
    () => () => {},
    () => isOutsideOpenHours(Date.now(), openTime, closeTime),
    () => false,
  );

  // Status yang dilihat pembeli (sama dengan backend D2): saklar menyala DAN di dalam jam buka.
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
