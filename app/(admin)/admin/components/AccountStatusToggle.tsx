// Komponen AccountStatusToggle: status akun (aktif/nonaktif) dengan tombol Nonaktifkan/Aktifkan dan dialog konfirmasi.
// Dipakai detail penjual dan detail pembeli di panel admin; server action dipilih menurut `kind`.
// "use client": komponen ini berjalan di peramban karena memakai state dan router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash } from "lucide-react";
import { setCustomerActive } from "@/app/actions/admin/customers";
import { setMerchantAccountActive } from "@/app/actions/admin/merchant-edit";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";

/**
 * Status akun dan tombol ubah status.
 * @param props.kind    `merchant` (id toko) atau `customer` (id pembeli)
 * @param props.id      id toko atau pembeli
 * @param props.active  status akun sekarang
 * @param props.canEdit `false` hanya menampilkan status (admin support)
 * @returns lencana status, tombol, dan dialog konfirmasi
 */
export function AccountStatusToggle({
  kind,
  id,
  active,
  canEdit,
}: {
  kind: "merchant" | "customer";
  id: number;
  active: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  // Menjalankan perubahan status, lalu memuat ulang data halaman.
  async function change(next: boolean) {
    setBusy(true);
    const result = await callAction<unknown>(() =>
      kind === "merchant" ? setMerchantAccountActive(id, next) : setCustomerActive(id, next),
    );
    setBusy(false);
    setConfirming(false);
    if ("error" in result) return void toast({ tone: "danger", message: result.error.message });
    toast({ tone: "success", message: next ? "Akun diaktifkan" : "Akun dinonaktifkan" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {active ? (
        <Badge tone="success" icon={CircleCheck}>
          Akun aktif
        </Badge>
      ) : (
        <Badge tone="danger" icon={CircleSlash}>
          Akun nonaktif
        </Badge>
      )}
      {canEdit &&
        (active ? (
          <Button variant="secondary" onClick={() => setConfirming(true)} disabled={busy}>
            Nonaktifkan akun
          </Button>
        ) : (
          <Button onClick={() => change(true)} loading={busy} loadingText="Menyimpan…">
            Aktifkan akun
          </Button>
        ))}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Nonaktifkan akun?"
        body={`Akun ${kind === "merchant" ? "penjual ini" : "pembeli ini"} tidak bisa masuk dan langsung dikeluarkan dari semua perangkat.${
          kind === "merchant" ? " Tokonya juga hilang dari katalog." : ""
        } Riwayat pesanan tetap tersimpan, dan akun bisa diaktifkan lagi kapan saja.`}
        confirmLabel="Ya, nonaktifkan"
        tone="danger"
        busy={busy}
        onConfirm={() => change(false)}
      />
    </div>
  );
}
