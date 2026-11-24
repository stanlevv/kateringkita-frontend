// Komponen AdminActionDialog: tombol aksi admin untuk satu penjual (verifikasi, minta perbaikan, tangguhkan, aktifkan
// lagi, tutup hari ini) beserta dialog konfirmasi atau alasannya. Dipakai antrean verifikasi dan detail penjual.
// Aksi dikirim lewat server action applyMerchantAction (app/actions/admin/merchants.ts, POST /admin/merchants/<id>/<aksi>).
// Tombol yang muncul mengikuti status verifikasi penjual (ALLOWED_ACTIONS di services/admin-merchant.service.ts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
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

// Label, warna tombol, dan pesan sukses per aksi.
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
// Judul dialog untuk aksi yang wajib disertai alasan.
const REASON_DIALOG_TITLES: Partial<Record<MerchantAction, string>> = {
  "request-fix": "Minta penjual memperbaiki",
  suspend: "Tangguhkan penjual",
};

/**
 * Isi dialog alasan (minta perbaikan atau tangguhkan). Alasan wajib diisi, maksimal 500 karakter.
 * @param props.action aksi yang sedang dikonfirmasi
 * @param props.busy true saat aksi sedang dikirim (tombol dimatikan)
 * @param props.onClose menutup dialog
 * @param props.onSubmit dipanggil dengan alasan yang sudah dipangkas
 * @returns isian alasan dan tombol Batal/aksi
 */
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

/**
 * Tombol aksi penjual sesuai status verifikasinya. Semua aksi lewat dialog: verifikasi, aktifkan lagi, dan tutup hari
 * ini lewat dialog konfirmasi; minta perbaikan dan tangguhkan lewat dialog alasan. Setelah berhasil tampil toast dan
 * data halaman dimuat ulang (router.refresh).
 * @param props.id id penjual
 * @param props.status status verifikasi penjual saat ini
 * @param props.checklistComplete true bila semua butir checklist toko terpenuhi (mengubah teks konfirmasi verifikasi)
 * @returns deretan tombol dan dialog-dialognya
 */
export function AdminActionDialog({
  id,
  status,
  checklistComplete,
}: {
  id: number;
  status: VerificationStatus;
  checklistComplete: boolean;
}) {
  // 1. Dialog yang sedang terbuka (null = tidak ada) dan tanda sedang mengirim.
  const router = useRouter();
  const [dialog, setDialog] = useState<MerchantAction | null>(null);
  const [busy, setBusy] = useState(false);

  // 2. Kirim aksi. Dialog tetap terbuka (alasan tetap terisi) saat gagal; menutup hanya bila berhasil atau bila status
  //    sudah berubah di server (409 CONFLICT).
  async function submit(action: MerchantAction, reason?: string) {
    // 1. Cegah kirim ganda, lalu panggil server action.
    if (busy) return;
    setBusy(true);
    const result = await callAction(() => applyMerchantAction(id, action, reason));
    setBusy(false);
    // 2. Gagal: tampilkan pesan; bila status sudah berubah, tutup dialog dan muat ulang data.
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
    // 3. Berhasil: tutup dialog, toast sukses, muat ulang data.
    setDialog(null);
    toast({ tone: "success", message: ACTION_BUTTONS[action].successMessage });
    router.refresh();
  }

  // 3. Semua tombol hanya membuka dialog, termasuk verifikasi dengan checklist lengkap: checklist diisi penjual sendiri,
  //    dan aksi sekali klik bisa dipicu clickjacking.
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
