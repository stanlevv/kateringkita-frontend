"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { catatPencairan } from "@/app/actions/pencairan";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { formatJam, formatRupiah, formatTanggal } from "@/lib/format";
import type { SaldoPenjual } from "@/types/pencairan";

const waktu = (iso: string) => `${formatTanggal(iso)} ${formatJam(iso)}`;

/**
 * F26: admin mentransfer dulu lewat bank KateringKita, lalu mencatat nomor referensinya di sini.
 * `asOf` = waktu saldo dihitung; backend menolak (409) bila saldo berubah sejak itu atau sudah dicatat.
 */
export function CatatPencairan({ saldo, asOf }: { saldo: SaldoPenjual; asOf: string }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [referensi, setReferensi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState<{ reference?: string; note?: string }>({});
  const [sibuk, setSibuk] = useState(false);
  const r = saldo.account;

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (sibuk) return;
    setSibuk(true);
    const h = await panggil(() => catatPencairan({ merchant_id: saldo.merchant_id, amount: saldo.amount, until: asOf, reference: referensi, note: catatan }));
    setSibuk(false);
    if ("error" in h) {
      if (h.error.fields) return setGalat({ reference: h.error.fields.reference?.[0], note: h.error.fields.note?.[0] });
      toast({ tone: "danger", message: h.error.message });
      // saldo berubah atau sudah dicatat admin lain: muat ulang angka terbaru
      if (h.error.code === "CONFLICT") {
        setBuka(false);
        router.refresh();
      }
      return;
    }
    setBuka(false);
    toast({ tone: "success", message: `Pencairan ${formatRupiah(h.data.amount)} untuk ${saldo.business_name} tercatat.` });
    router.refresh();
  }

  if (!r) return <span className="text-sm font-medium text-warning">Rekening belum diisi</span>;
  return (
    <>
      <Button variant="secondary" onClick={() => setBuka(true)}>Catat pencairan</Button>
      <Dialog open={buka} onClose={() => setBuka(false)} title="Catat pencairan">
        <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">Toko</dt><dd className="text-right font-medium text-ink">{saldo.business_name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">Nominal</dt><dd className="font-mono font-semibold text-ink">{formatRupiah(saldo.amount)}</dd></div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Ke rekening</dt>
              <dd className="text-right text-ink">{r.bank_name} <span className="font-mono">{r.account_number}</span><br />a.n. {r.account_name}</dd>
            </div>
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">Rekening diubah</dt><dd className="text-right text-ink">{waktu(r.updated_at)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">Pesanan</dt><dd className="text-right text-ink">{saldo.orders} pesanan selesai sampai {waktu(asOf)}</dd></div>
          </dl>
          <p className="text-sm text-ink-muted">Transfer nominal di atas ke rekening toko lebih dulu, lalu isi nomor referensi dari bukti transfer.</p>
          <Field label="Nomor referensi transfer" id={`ref-${saldo.merchant_id}`} required error={galat.reference}>
            <Input autoFocus autoComplete="off" value={referensi} maxLength={100} onChange={(e) => { setReferensi(e.target.value); setGalat({}); }} />
          </Field>
          <Field label="Catatan (opsional)" id={`catatan-${saldo.merchant_id}`} error={galat.note}>
            <Input autoComplete="off" value={catatan} maxLength={255} onChange={(e) => setCatatan(e.target.value)} />
          </Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setBuka(false)}>Batal</Button>
            <Button type="submit" loading={sibuk} loadingText="Mencatat…">Catat pencairan</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
