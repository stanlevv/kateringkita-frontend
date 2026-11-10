"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { tandaiRefund } from "@/app/actions/pencairan";
import { Button } from "@/app/components/ui/Button";
import { Dialog } from "@/app/components/ui/Dialog";
import { Field } from "@/app/components/ui/Field";
import { Input } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";
import { panggil } from "@/lib/aksi";
import { formatRupiah } from "@/lib/format";
import type { RefundMenunggu } from "@/types/pencairan";

/** F26: dana dikembalikan di luar aplikasi (dashboard Midtrans atau transfer), lalu ditandai di sini dengan nomor referensinya. */
export function TandaiRefund({ refund }: { refund: RefundMenunggu }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [referensi, setReferensi] = useState("");
  const [galat, setGalat] = useState<string>();
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (sibuk) return;
    setSibuk(true);
    const h = await panggil(() => tandaiRefund(refund.code, referensi));
    setSibuk(false);
    if ("error" in h) {
      if (h.error.fields?.reference) return setGalat(h.error.fields.reference[0]);
      toast({ tone: "danger", message: h.error.message });
      // sudah ditandai admin lain
      if (h.error.code === "NOT_FOUND") {
        setBuka(false);
        router.refresh();
      }
      return;
    }
    setBuka(false);
    toast({ tone: "success", message: `Pengembalian ${formatRupiah(h.data.amount)} untuk ${refund.code} tercatat.` });
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setBuka(true)}>Tandai dikembalikan</Button>
      <Dialog open={buka} onClose={() => setBuka(false)} title="Tandai dana dikembalikan">
        <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
          <p className="text-ink">
            Kembalikan <span className="font-mono font-semibold">{formatRupiah(refund.amount)}</span> ke {refund.customer_name} untuk pesanan{" "}
            <span className="font-mono">{refund.code}</span> lewat dashboard Midtrans atau transfer, lalu isi nomor referensinya.
          </p>
          <Field label="Nomor referensi pengembalian" id={`refund-${refund.code}`} required error={galat}>
            <Input autoFocus autoComplete="off" value={referensi} maxLength={100} onChange={(e) => { setReferensi(e.target.value); setGalat(undefined); }} />
          </Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setBuka(false)}>Batal</Button>
            <Button type="submit" loading={sibuk} loadingText="Menyimpan…">Tandai dikembalikan</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
