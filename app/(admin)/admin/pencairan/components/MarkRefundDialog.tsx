// Komponen MarkRefundDialog: tombol "Tandai dikembalikan" dan dialognya untuk satu pesanan di tabel refund
// /admin/pencairan. Refund = uang pembeli dikembalikan karena pesanan batal padahal sudah lunas. Dikirim lewat server
// action markRefundPaid (app/actions/payouts.ts, POST /admin/refunds/<kode>).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { markRefundPaid } from "@/app/actions/payouts";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatRupiah } from "@/lib/format";
import type { PendingRefund } from "@/types/payout";

/**
 * Tombol dan dialog tandai refund. Dana dikembalikan di luar aplikasi (dashboard Midtrans atau transfer), lalu ditandai
 * di sini dengan nomor referensinya.
 * @param props.refund pesanan yang dananya harus dikembalikan
 * @returns tombol dan dialog
 */
export function MarkRefundDialog({ refund }: { refund: PendingRefund }) {
  // 1. State dialog, isian referensi, galat, dan tanda sedang mengirim.
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // 2. Kirim nomor referensi pengembalian.
  async function submit(event: FormEvent) {
    // 1. Cegah kirim ganda, lalu panggil server action.
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await callAction(() => markRefundPaid(refund.code, reference));
    setBusy(false);
    // 2. Gagal: galat referensi tampil di isian, galat lain jadi toast.
    if ("error" in result) {
      if (result.error.fields?.reference) return setError(result.error.fields.reference[0]);
      toast({ tone: "danger", message: result.error.message });
      // NOT_FOUND = sudah ditandai admin lain: tutup dialog dan muat ulang daftar
      if (result.error.code === "NOT_FOUND") {
        setOpen(false);
        router.refresh();
      }
      return;
    }
    // 3. Berhasil: tutup dialog, toast, muat ulang data halaman.
    setOpen(false);
    toast({
      tone: "success",
      message: `Pengembalian ${formatRupiah(result.data.amount)} untuk ${refund.code} tercatat.`,
    });
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Tandai dikembalikan
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Tandai dana dikembalikan">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <p className="text-ink">
            Kembalikan <span className="font-mono font-semibold">{formatRupiah(refund.amount)}</span> ke{" "}
            {refund.customer_name} untuk pesanan <span className="font-mono">{refund.code}</span> lewat dashboard
            Midtrans atau transfer, lalu isi nomor referensinya.
          </p>
          <Field label="Nomor referensi pengembalian" id={`refund-${refund.code}`} required error={error}>
            <Input
              autoFocus
              autoComplete="off"
              value={reference}
              maxLength={100}
              onChange={(event) => {
                setReference(event.target.value);
                setError(undefined);
              }}
            />
          </Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={busy} loadingText="Menyimpan…">
              Tandai dikembalikan
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
