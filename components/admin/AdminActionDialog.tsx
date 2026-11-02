"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aksiPenjual } from "@/app/actions/admin/merchants";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { AKSI_BOLEH } from "@/lib/admin/merchants";
import type { AksiPenjual, StatusVerifikasi } from "@/lib/admin/types";

const TOMBOL: Record<AksiPenjual, { label: string; variant: "primary" | "secondary" | "danger"; sukses: string }> = {
  verify: { label: "Verifikasi", variant: "primary", sukses: "Penjual terverifikasi." },
  "request-fix": { label: "Minta perbaiki", variant: "secondary", sukses: "Permintaan perbaikan terkirim." },
  suspend: { label: "Tangguhkan", variant: "danger", sukses: "Penjual ditangguhkan." },
  reactivate: { label: "Aktifkan lagi", variant: "primary", sukses: "Penjual diaktifkan lagi." },
  "close-today": { label: "Tutup hari ini", variant: "secondary", sukses: "Dapur ditutup untuk hari ini." },
};
const JUDUL_ALASAN: Partial<Record<AksiPenjual, string>> = { "request-fix": "Minta penjual memperbaiki", suspend: "Tangguhkan penjual" };

function FormAlasan({ aksi, sibuk, onClose, onKirim }: { aksi: AksiPenjual; sibuk: boolean; onClose: () => void; onKirim: (alasan: string) => void }) {
  const [teks, setTeks] = useState("");
  return (
    <>
      <Field label="Alasan" required help={`${teks.length}/500`}>
        <Textarea autoFocus value={teks} maxLength={500} onChange={(e) => setTeks(e.target.value)} />
      </Field>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Batal</Button>
        <Button variant={TOMBOL[aksi].variant === "danger" ? "danger" : "primary"} disabled={!teks.trim() || sibuk} onClick={() => onKirim(teks.trim())}>{TOMBOL[aksi].label}</Button>
      </div>
    </>
  );
}

/** A-05 — tombol aksi penjual sesuai status (K1) dengan konfirmasi/alasan, toast, dan penyegaran data. */
export function AdminActionDialog({ id, status, lengkap }: { id: number; status: StatusVerifikasi; lengkap: boolean }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<AksiPenjual | null>(null);
  const [sibuk, setSibuk] = useState(false);

  // Dialog tetap terbuka (alasan terisi) saat gagal; menutup hanya bila berhasil atau status sudah berubah (409).
  async function kirim(aksi: AksiPenjual, alasan?: string) {
    if (sibuk) return;
    setSibuk(true);
    const r = await panggil(() => aksiPenjual(id, aksi, alasan));
    setSibuk(false);
    if ("error" in r) {
      const konflik = r.error.code === "CONFLICT";
      toast({ tone: "danger", message: konflik ? "Status penjual sudah berubah. Data dimuat ulang." : r.error.message });
      if (konflik) { setDialog(null); router.refresh(); }
      return;
    }
    setDialog(null);
    toast({ tone: "success", message: TOMBOL[aksi].sukses });
    router.refresh();
  }

  const klik = (aksi: AksiPenjual) => (aksi === "verify" && lengkap ? void kirim(aksi) : setDialog(aksi));

  return (
    <div className="flex flex-wrap gap-2">
      {AKSI_BOLEH[status].map((a) => (
        <Button key={a} variant={TOMBOL[a].variant} disabled={sibuk} onClick={() => klik(a)}>{TOMBOL[a].label}</Button>
      ))}
      <Dialog open={dialog === "request-fix" || dialog === "suspend"} onClose={() => setDialog(null)} title={JUDUL_ALASAN[dialog ?? "suspend"] ?? ""}>
        {(dialog === "request-fix" || dialog === "suspend") && <FormAlasan aksi={dialog} sibuk={sibuk} onClose={() => setDialog(null)} onKirim={(al) => kirim(dialog, al)} />}
      </Dialog>
      <ConfirmDialog
        open={dialog === "verify"} onClose={() => setDialog(null)} title="Verifikasi penjual" tone="primary" confirmLabel="Tetap verifikasi" busy={sibuk}
        body="Checklist belum lengkap. Tetap verifikasi?" onConfirm={() => kirim("verify")}
      />
      <ConfirmDialog
        open={dialog === "reactivate"} onClose={() => setDialog(null)} title="Aktifkan lagi toko" tone="primary" confirmLabel="Aktifkan lagi" busy={sibuk}
        body="Aktifkan lagi toko ini? Toko akan terlihat oleh pembeli." onConfirm={() => kirim("reactivate")}
      />
      <ConfirmDialog
        open={dialog === "close-today"} onClose={() => setDialog(null)} title="Tutup dapur hari ini" tone="primary" confirmLabel="Tutup hari ini" busy={sibuk}
        body="Dapur penjual akan ditutup. Penjual bisa membukanya lagi sendiri." onConfirm={() => kirim("close-today")}
      />
    </div>
  );
}
