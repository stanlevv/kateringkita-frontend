import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { cx, fokus } from "@/app/components/ui/cx";

type Props = { adaTitikTemu: boolean; adaMenu: boolean; dapurBuka: boolean; onBukaDapur: () => void; membuka?: boolean };

const tautan = cx("inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline", fokus);

/** DB-A5: kartu Siapkan toko, langkah dicentang otomatis dari data. */
export function SetupChecklist({ adaTitikTemu, adaMenu, dapurBuka, onBukaDapur, membuka }: Props) {
  const langkah = [
    { selesai: adaTitikTemu, isi: <Link href="/pengaturan?lengkapi=titik-temu" className={tautan}>Lengkapi pengaturan</Link> },
    { selesai: adaMenu, isi: <Link href="/menu/baru" className={tautan}>Tambah menu pertama</Link> },
    { selesai: dapurBuka, isi: dapurBuka ? <span className="inline-flex min-h-11 items-center font-medium text-ink">Buka dapur</span> : <Button variant="secondary" loading={membuka} onClick={onBukaDapur}>Buka dapur</Button> },
  ];
  return (
    <section aria-labelledby="judul-siapkan" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="judul-siapkan" className="text-lg font-semibold text-ink">Siapkan toko</h2>
      <p className="text-sm text-ink-muted">Selesaikan tiga langkah ini agar pembeli bisa mulai memesan.</p>
      <ol className="mt-3 flex flex-col gap-1">
        {langkah.map((l, i) => (
          <li key={i} data-selesai={String(l.selesai)} className="flex items-center gap-3">
            <span aria-hidden className={cx("inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold", l.selesai ? "bg-success-bg text-success" : "bg-subtle text-ink")}>
              {l.selesai ? <Check className="size-4" /> : i + 1}
            </span>
            {l.isi}
            <span className="text-sm text-ink-muted">{l.selesai ? "Selesai" : "Belum"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
