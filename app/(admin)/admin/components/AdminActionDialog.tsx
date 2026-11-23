"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyMerchantAction } from "@/app/actions/admin/merchants";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Textarea } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { ALLOWED_ACTIONS } from "@/services/admin-merchant.service";
import type { MerchantAction, VerificationStatus } from "@/types/admin";

const ACTION_BUTTONS: Record<
  MerchantAction,
  { label: string; variant: "primary" | "secondary" | "danger"; successMessage: string }
> = {
  verify: { label: "Verifikasi", variant: "primary", successMessage: "Penjual terverifikasi." },
  "request-fix": { label: "Minta perbaiki", variant: "secondary", successMessage: "Permintaan perbaikan terkirim." },
  suspend: { label: "Tangguhkan", variant: "danger", successMessage: "Penjual ditangguhkan." },
  reactivate: { label: "Aktifkan lagi", variant: "primary", successMessage: "Penjual diaktifkan lagi." },
  "close-today": { label: "Tutup hari ini", variant: "secondary", successMessage: "Dapur ditutup untuk hari ini." },
};
const REASON_DIALOG_TITLES: Partial<Record<MerchantAction, string>> = {
  "request-fix": "Minta penjual memperbaiki",
  suspend: "Tangguhkan penjual",
};

function ReasonForm({
  action,
  busy,
  onClose,
  onSubmit,
}: {
  action: MerchantAction;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reasonText, setReasonText] = useState("");
  return (
    <>
      <Field label="Alasan" required help={`${reasonText.length}/500`}>
        <Textarea
          autoFocus
          value={reasonText}
          maxLength={500}
          onChange={(event) => setReasonText(event.target.value)}
        />
      </Field>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant={ACTION_BUTTONS[action].variant === "danger" ? "danger" : "primary"}
          disabled={!reasonText.trim() || busy}
          onClick={() => onSubmit(reasonText.trim())}
        >
          {ACTION_BUTTONS[action].label}
        </Button>
      </div>
    </>
  );
}

/** A-05 — tombol aksi penjual sesuai status (K1) dengan konfirmasi/alasan, toast, dan penyegaran data. */
export function AdminActionDialog({
  id,
  status,
  checklistComplete,
}: {
  id: number;
  status: VerificationStatus;
  checklistComplete: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<MerchantAction | null>(null);
  const [busy, setBusy] = useState(false);

  // Dialog tetap terbuka (alasan terisi) saat gagal; menutup hanya bila berhasil atau status sudah berubah (409).
  async function submit(action: MerchantAction, reason?: string) {
    if (busy) return;
    setBusy(true);
    const result = await callAction(() => applyMerchantAction(id, action, reason));
    setBusy(false);
    if ("error" in result) {
      const isConflict = result.error.code === "CONFLICT";
      toast({
        tone: "danger",
        message: isConflict ? "Status penjual sudah berubah. Data dimuat ulang." : result.error.message,
      });
      if (isConflict) {
        setDialog(null);
        router.refresh();
      }
      return;
    }
    setDialog(null);
    toast({ tone: "success", message: ACTION_BUTTONS[action].successMessage });
    router.refresh();
  }

  // AUD-35: semua aksi lewat dialog, termasuk verifikasi dengan checklist lengkap (checklist diisi penjual sendiri)
  const openDialog = (action: MerchantAction) => setDialog(action);

  return (
    <div className="flex flex-wrap gap-2">
      {ALLOWED_ACTIONS[status].map((action) => (
        <Button
          key={action}
          variant={ACTION_BUTTONS[action].variant}
          disabled={busy}
          onClick={() => openDialog(action)}
        >
          {ACTION_BUTTONS[action].label}
        </Button>
      ))}
      <Dialog
        open={dialog === "request-fix" || dialog === "suspend"}
        onClose={() => setDialog(null)}
        title={REASON_DIALOG_TITLES[dialog ?? "suspend"] ?? ""}
      >
        {(dialog === "request-fix" || dialog === "suspend") && (
          <ReasonForm
            action={dialog}
            busy={busy}
            onClose={() => setDialog(null)}
            onSubmit={(reason) => submit(dialog, reason)}
          />
        )}
      </Dialog>
      <ConfirmDialog
        open={dialog === "verify"}
        onClose={() => setDialog(null)}
        title="Verifikasi penjual"
        tone="primary"
        confirmLabel={checklistComplete ? "Ya, verifikasi" : "Tetap verifikasi"}
        busy={busy}
        body={
          checklistComplete
            ? "Checklist lengkap. Verifikasi toko ini? Toko akan tampil untuk pembeli."
            : "Checklist belum lengkap. Tetap verifikasi?"
        }
        onConfirm={() => submit("verify")}
      />
      <ConfirmDialog
        open={dialog === "reactivate"}
        onClose={() => setDialog(null)}
        title="Aktifkan lagi toko"
        tone="primary"
        confirmLabel="Aktifkan lagi"
        busy={busy}
        body="Aktifkan lagi toko ini? Toko akan terlihat oleh pembeli."
        onConfirm={() => submit("reactivate")}
      />
      <ConfirmDialog
        open={dialog === "close-today"}
        onClose={() => setDialog(null)}
        title="Tutup dapur hari ini"
        tone="primary"
        confirmLabel="Tutup hari ini"
        busy={busy}
        body="Dapur penjual akan ditutup. Penjual bisa membukanya lagi sendiri."
        onConfirm={() => submit("close-today")}
      />
    </div>
  );
}
