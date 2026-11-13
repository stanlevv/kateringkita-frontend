"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tutupTiket } from "@/app/actions/admin/tiket";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";

/** Tutup tiket setelah konfirmasi. Dialog tetap terbuka bila gagal; berhasil -> toast + muat ulang. */
export function TutupTiket({ code }: { code: string }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  async function tutup() {
    if (sibuk) return;
    setSibuk(true);
    const r = await panggil(() => tutupTiket(code));
    setSibuk(false);
    if ("error" in r) {
      toast({ tone: "danger", message: r.error.message });
      return;
    }
    setBuka(false);
    toast({ tone: "success", message: `Tiket ${code} ditutup.` });
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setBuka(true)}>Tutup tiket</Button>
      <ConfirmDialog
        open={buka} onClose={() => setBuka(false)} title="Tutup tiket" tone="primary" confirmLabel="Tutup tiket" busy={sibuk}
        body="Pembeli mendapat notifikasi dan tidak bisa membalas tiket ini lagi. Bila masih perlu bantuan, pembeli membuat tiket baru."
        onConfirm={() => void tutup()}
      />
    </>
  );
}
