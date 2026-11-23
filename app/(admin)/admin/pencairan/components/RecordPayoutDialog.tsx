// Komponen RecordPayoutDialog: tombol "Catat pencairan" dan dialognya untuk satu baris saldo toko di /admin/pencairan.
// Pencairan = admin mentransfer saldo toko ke rekening toko di luar aplikasi, lalu mencatat nomor referensinya di sini
// lewat server action recordPayout (app/actions/payouts.ts, POST /admin/payouts).
// "use client": komponen ini berjalan di peramban (client component) karena memakai state dan router.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { recordPayout } from "@/app/actions/payouts";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { callAction } from "@/lib/action";
import { formatTime, formatRupiah, formatDate } from "@/lib/format";
import type { MerchantBalance } from "@/types/payout";

// Tanggal dan jam (WIB) dari waktu ISO.
const formatDateTime = (iso: string) => `${formatDate(iso)} ${formatTime(iso)}`;

/**
 * Tombol dan dialog catat pencairan. Admin mentransfer dulu lewat bank KateringKita, lalu mencatat nomor referensinya.
 * Backend menolak (409) bila saldo berubah sejak `asOf` atau sudah dicatat admin lain.
 * @param props.balance saldo satu toko (nominal, jumlah pesanan, rekening)
 * @param props.asOf waktu saldo dihitung (ISO); dikirim sebagai `until`
 * @returns tombol dan dialog, atau teks "Rekening belum diisi" bila toko belum punya rekening
 */
export function RecordPayoutDialog({ balance, asOf }: { balance: MerchantBalance; asOf: string }) {
  // 1. State dialog, isian referensi dan catatan, galat per isian, dan tanda sedang mengirim.
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ reference?: string; note?: string }>({});
  const [busy, setBusy] = useState(false);
  const account = balance.account;

  // 2. Kirim catatan pencairan. Nominal dan waktu saldo yang dikirim adalah yang tampil di dialog.
  async function submit(event: FormEvent) {
    // 1. Cegah kirim ganda, lalu panggil server action.
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await callAction(() =>
      recordPayout({
        merchant_id: balance.merchant_id,
        amount: balance.amount,
        until: asOf,
        reference,
        note,
        account_updated_at: balance.account?.updated_at, // versi rekening yang tampil; ditolak bila rekening sudah diganti
      }),
    );
    setBusy(false);
    // 2. Gagal: galat per isian tampil di bawah isian; galat lain jadi toast.
    if ("error" in result) {
      if (result.error.fields)
        return setErrors({ reference: result.error.fields.reference?.[0], note: result.error.fields.note?.[0] });
      toast({ tone: "danger", message: result.error.message });
      // saldo berubah atau sudah dicatat admin lain: muat ulang angka terbaru
      if (result.error.code === "CONFLICT") {
        setOpen(false);
        router.refresh();
      }
      return;
    }
    // 3. Berhasil: tutup dialog, tampilkan toast, dan muat ulang data halaman (router.refresh).
    setOpen(false);
    toast({
      tone: "success",
      message: `Pencairan ${formatRupiah(result.data.amount)} untuk ${balance.business_name} tercatat.`,
    });
    router.refresh();
  }

  // 3. Toko tanpa rekening belum bisa dicairkan.
  if (!account) return <span className="text-sm font-medium text-warning">Rekening belum diisi</span>;
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Catat pencairan
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Catat pencairan">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Toko</dt>
              <dd className="text-right font-medium text-ink">{balance.business_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Nominal</dt>
              <dd className="font-mono font-semibold text-ink">{formatRupiah(balance.amount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Ke rekening</dt>
              <dd className="text-right text-ink">
                {account.bank_name} <span className="font-mono">{account.account_number}</span>
                <br />
                a.n. {account.account_name}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Rekening diubah</dt>
              <dd className="text-right text-ink">{formatDateTime(account.updated_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Pesanan</dt>
              <dd className="text-right text-ink">
                {balance.orders} pesanan selesai sampai {formatDateTime(asOf)}
              </dd>
            </div>
          </dl>
          <p className="text-sm text-ink-muted">
            Transfer nominal di atas ke rekening toko lebih dulu, lalu isi nomor referensi dari bukti transfer.
          </p>
          <Field label="Nomor referensi transfer" id={`ref-${balance.merchant_id}`} required error={errors.reference}>
            <Input
              autoFocus
              autoComplete="off"
              value={reference}
              maxLength={100}
              onChange={(event) => {
                setReference(event.target.value);
                setErrors({});
              }}
            />
          </Field>
          <Field label="Catatan (opsional)" id={`catatan-${balance.merchant_id}`} error={errors.note}>
            <Input autoComplete="off" value={note} maxLength={255} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={busy} loadingText="Mencatat…">
              Catat pencairan
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
