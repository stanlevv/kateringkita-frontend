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
export function useUbahStatusDapur() {
  const { setIsOpen } = useStoreStatus();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function ubah(ke: boolean) {
    setPending(true);
    setIsOpen(ke);
    const r = await callAction(() => setStoreOpen(ke));
    setPending(false);
    if ("error" in r) {
      setIsOpen(!ke);
      toast({ tone: "danger", message: "Status dapur belum berubah. Coba lagi." });
    } else {
      router.refresh();
    }
  }
  return { ubah, pending };
}

/** SH-N3 / SH-E1 / SH-A1. `rail`: hanya saklar kecuali sidebar sedang lebar (varian sb-lebar). Status dibaca dari StoreStatusProvider. */
export function StoreStatusToggle({ rail = false }: { rail?: boolean }) {
  const { isOpen, buka, tutup } = useStoreStatus();
  const { ubah, pending } = useUbahStatusDapur();
  const [konfirmasi, setKonfirmasi] = useState(false);

  // Snapshot server = false, jadi HTML server dan klien awal sama; dihitung ulang setelah hidrasi.
  const luarJam = useSyncExternalStore(
    () => () => {},
    () => isOutsideOpenHours(Date.now(), buka, tutup),
    () => false,
  );

  // Status yang dilihat pembeli (sama dengan backend D2): saklar menyala DAN di dalam jam buka.
  // Saklar menyala di luar jam = toko buka otomatis saat jam buka tiba.
  const bukaUntukPembeli = isOpen && !luarJam;

  return (
    <div className={cx("flex flex-col gap-1", rail && "items-center sb-lebar:items-stretch")}>
      <div className="flex items-center justify-between gap-2">
        <div className={cx(rail && "hidden sb-lebar:block")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Status dapur</p>
          <p className={cx("text-sm font-semibold", bukaUntukPembeli ? "text-success" : "text-ink-muted")}>
            {bukaUntukPembeli ? "Buka" : "Tutup"}
          </p>
        </div>
        <Switch
          checked={isOpen}
          disabled={pending}
          label={`Status dapur: ${isOpen ? "Buka" : "Tutup"}`}
          onChange={(v) => (v ? ubah(true) : setKonfirmasi(true))}
        />
      </div>
      {isOpen && luarJam && (
        <p className={cx("text-xs text-warning", rail && "hidden sb-lebar:block")}>
          Di luar jam buka ({openHoursLabel(buka, tutup)}) · pembeli belum bisa memesan
        </p>
      )}
      <ConfirmDialog
        open={konfirmasi}
        onClose={() => setKonfirmasi(false)}
        title="Tutup dapur?"
        body="Pembeli tidak bisa memesan sampai dibuka lagi."
        confirmLabel="Tutup dapur"
        tone="danger"
        onConfirm={() => {
          setKonfirmasi(false);
          void ubah(false);
        }}
      />
    </div>
  );
}
