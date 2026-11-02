"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { setStoreOpen } from "@/app/actions/store";
import { panggil } from "@/lib/aksi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toast";
import { cx } from "@/components/ui/cx";
import { diLuarJamBuka, labelJamBuka } from "@/lib/shell";
import { useStoreStatus } from "./StoreStatus";

/** SH-E1: ubah status dapur lewat status bersama; gagal -> kembali + toast. Dipakai juga oleh banner dashboard. */
export function useUbahStatusDapur() {
  const { setIsOpen } = useStoreStatus();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function ubah(ke: boolean) {
    setPending(true);
    setIsOpen(ke);
    const r = await panggil(() => setStoreOpen(ke));
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

/** SH-N3 / SH-E1 / SH-A1. `rail`: di bawah 1280 px hanya saklar. Status dibaca dari StoreStatusProvider. */
export function StoreStatusToggle({ rail = false }: { rail?: boolean }) {
  const { isOpen, buka, tutup } = useStoreStatus();
  const { ubah, pending } = useUbahStatusDapur();
  const [konfirmasi, setKonfirmasi] = useState(false);

  // Snapshot server = false, jadi HTML server dan klien awal sama; dihitung ulang setelah hidrasi.
  const luarJam = useSyncExternalStore(
    () => () => {},
    () => diLuarJamBuka(Date.now(), buka, tutup),
    () => false,
  );

  return (
    <div className={cx("flex flex-col gap-1", rail && "items-center xl:items-stretch")}>
      <div className="flex items-center justify-between gap-2">
        <div className={cx(rail && "hidden xl:block")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Status dapur</p>
          <p className={cx("text-sm font-semibold", isOpen ? "text-success" : "text-ink-muted")}>{isOpen ? "Buka" : "Tutup"}</p>
        </div>
        <Switch
          checked={isOpen}
          disabled={pending}
          label={`Status dapur: ${isOpen ? "Buka" : "Tutup"}`}
          onChange={(v) => (v ? ubah(true) : setKonfirmasi(true))}
        />
      </div>
      {luarJam && <p className={cx("text-xs text-warning", rail && "hidden xl:block")}>Di luar jam buka ({labelJamBuka(buka, tutup)})</p>}
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
