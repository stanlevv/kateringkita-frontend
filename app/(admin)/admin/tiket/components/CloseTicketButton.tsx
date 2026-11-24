// Komponen CloseTicketButton: tombol "Tutup tiket" dan dialog konfirmasinya di kepala halaman /admin/tiket/<kode>.
// Menutup tiket lewat server action closeTicket (app/actions/admin/tickets.ts, POST /admin/tickets/<kode>/close).
// Tiket yang ditutup tidak bisa dibalas lagi; pembeli membuat tiket baru bila masih perlu bantuan.
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeTicket } from "@/app/actions/admin/tickets";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";

/**
 * Tutup tiket setelah konfirmasi. Dialog tetap terbuka bila gagal; berhasil -> toast + muat ulang.
 * @param props.code kode tiket yang ditutup
 * @returns tombol dan dialog konfirmasi
 */
export function CloseTicketButton({ code }: { code: string }) {
  // 1. State dialog terbuka dan tanda sedang mengirim.
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // 2. Dipanggil dari tombol konfirmasi di dialog.
  async function confirmClose() {
    // 1. Cegah kirim ganda, lalu panggil server action.
    if (busy) return;
    setBusy(true);
    const result = await callAction(() => closeTicket(code));
    setBusy(false);
    // 2. Gagal: toast pesan backend, dialog tetap terbuka agar bisa dicoba lagi.
    if ("error" in result) {
      toast({ tone: "danger", message: result.error.message });
      return;
    }
    // 3. Berhasil: tutup dialog, toast, dan muat ulang data halaman.
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
