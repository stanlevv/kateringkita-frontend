"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeTicket } from "@/app/actions/admin/tickets";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";

/** Tutup tiket setelah konfirmasi. Dialog tetap terbuka bila gagal; berhasil -> toast + muat ulang. */
export function CloseTicketButton({ code }: { code: string }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirmClose() {
    if (busy) return;
    setBusy(true);
    const result = await callAction(() => closeTicket(code));
    setBusy(false);
    if ("error" in result) {
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    setDialogOpen(false);
    toast({ tone: "success", message: `Tiket ${code} ditutup.` });
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setDialogOpen(true)}>
        Tutup tiket
      </Button>
      <ConfirmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Tutup tiket"
        tone="primary"
        confirmLabel="Tutup tiket"
        busy={busy}
        body="Pembeli mendapat notifikasi dan tidak bisa membalas tiket ini lagi. Bila masih perlu bantuan, pembeli membuat tiket baru."
        onConfirm={() => void confirmClose()}
      />
    </>
  );
}
