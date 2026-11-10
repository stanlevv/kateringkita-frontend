import { Download, Landmark, ReceiptText, Store, Tag } from "lucide-react";
import { GagalMuat } from "@/app/components/GagalMuat";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { Card } from "@/app/components/ui/Card";
import { cx, fokus } from "@/app/components/ui/cx";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { RangePicker } from "@/app/components/ui/RangePicker";
import { formatRupiah, hariIniWib } from "@/lib/format";
import { parseRentang } from "@/lib/laporan";
import { getRekapKeuangan } from "@/services/adminKeuanganService";
import { requireAdmin } from "@/services/authService";
import type { RekapKeuangan } from "@/types/admin";

type Baris = RekapKeuangan["rows"][number];
const rp = (k: keyof Baris) => (b: Baris) => formatRupiah(Number(b[k]));
const KOLOM: Column<Baris>[] = [
  { key: "toko", header: "Toko", cell: (b) => <span className="font-medium">{b.business_name}</span> },
  { key: "pesanan", header: "Pesanan", align: "right", cell: (b) => b.orders },
  { key: "subtotal", header: "Subtotal", align: "right", cell: rp("subtotal") },
  { key: "diskon-toko", header: "Diskon toko", align: "right", cell: rp("discount_merchant") },
  { key: "diskon-platform", header: "Diskon platform", align: "right", cell: rp("discount_platform") },
  { key: "biaya", header: "Biaya layanan", align: "right", cell: rp("service_fee") },
  { key: "total", header: "Total dibayar", align: "right", cell: rp("total") },
  { key: "toko-net", header: "Hak toko", align: "right", cell: rp("merchant_net") },
];

// F20 — rekap keuangan platform per toko (pesanan selesai). Rentang di URL: ?dari&sampai.
export default async function KeuanganPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string }> }) {
  await requireAdmin("super");
  const sp = await searchParams;
  const hariIni = hariIniWib();
  const { dari, sampai, galat } = parseRentang(sp.dari, sp.sampai, hariIni);
  const res = await getRekapKeuangan({ from: dari, to: sampai });
  const unduh = cx("inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-subtle", fokus);

  return (
    <PageHeader title="Keuangan" description="Omzet, diskon, dan biaya layanan dari pesanan selesai, per toko.">
      <div className="flex flex-col gap-6">
        <RangePicker key={`${dari}|${sampai}|${galat}`} dari={dari} sampai={sampai} hariIni={hariIni} galat={galat} />
        {"error" in res ? (
          <GagalMuat judul="Rekap keuangan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Total dibayar pembeli" icon={ReceiptText} value={formatRupiah(res.data.totals.total)} hint={`${res.data.totals.orders} pesanan selesai`} />
              <KpiCard label="Hak toko" icon={Store} value={formatRupiah(res.data.totals.merchant_net)} hint="Subtotal dikurangi diskon promo toko" />
              <KpiCard label="Pendapatan platform" icon={Landmark} value={formatRupiah(res.data.totals.platform_net)} hint="Biaya layanan dikurangi diskon promo platform" />
              <KpiCard label="Diskon promo" icon={Tag} value={formatRupiah(res.data.totals.discount_merchant + res.data.totals.discount_platform)}
                hint={`Toko ${formatRupiah(res.data.totals.discount_merchant)} · Platform ${formatRupiah(res.data.totals.discount_platform)}`} />
            </div>
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Per toko</h2>
                {res.data.rows.length > 0 && (
                  <a href={`/api/admin/keuangan/csv?dari=${dari}&sampai=${sampai}`} download className={unduh}>
                    <Download aria-hidden className="size-4" />Unduh CSV
                  </a>
                )}
              </div>
              {res.data.rows.length === 0 ? (
                <EmptyState icon={ReceiptText} title="Belum ada pesanan selesai di rentang ini" body="Coba pilih rentang tanggal lain." />
              ) : (
                <DataTable caption="Rekap keuangan per toko" columns={KOLOM} rows={res.data.rows} rowKey={(b) => String(b.merchant_id)} />
              )}
            </Card>
          </>
        )}
      </div>
    </PageHeader>
  );
}
