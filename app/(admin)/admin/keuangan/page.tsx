// Halaman /admin/keuangan: rekap keuangan platform per toko dari pesanan selesai dalam rentang tanggal, khusus admin
// super. Server component: membaca searchParams (?dari=&sampai=), mengambil rekap lewat getFinanceSummary
// (services/admin-finance.service.ts, GET /admin/finance), dan menyediakan tautan unduh CSV (berkas tabel yang bisa
// dibuka di Excel) ke /api/admin/keuangan/csv dengan rentang yang sama.
import { Download, Landmark, ReceiptText, Store, Tag } from "lucide-react";
import { LoadError } from "@/app/components/LoadError";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { Card } from "@/app/components/ui/Card";
import { cx, focusRing } from "@/app/components/ui/cx";
import { DataTable, type Column } from "@/app/components/ui/DataTable";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { KpiCard } from "@/app/components/ui/KpiCard";
import { RangePicker } from "@/app/components/ui/RangePicker";
import { formatRupiah, todayWib } from "@/lib/format";
import { parseRange } from "@/lib/report";
import { getFinanceSummary } from "@/services/admin-finance.service";
import { requireAdmin } from "@/services/auth.service";
import type { FinanceSummary } from "@/types/admin";

// Satu baris rekap (satu toko). rupiahCell membuat isi sel Rupiah dari kolom angka yang dipilih.
type FinanceRow = FinanceSummary["rows"][number];
const rupiahCell = (field: keyof FinanceRow) => (row: FinanceRow) => formatRupiah(Number(row[field]));
const COLUMNS: Column<FinanceRow>[] = [
  { key: "toko", header: "Toko", cell: (row) => <span className="font-medium">{row.business_name}</span> },
  { key: "pesanan", header: "Pesanan", align: "right", cell: (row) => row.orders },
  { key: "subtotal", header: "Subtotal", align: "right", cell: rupiahCell("subtotal") },
  { key: "diskon-toko", header: "Diskon toko", align: "right", cell: rupiahCell("discount_merchant") },
  { key: "diskon-platform", header: "Diskon platform", align: "right", cell: rupiahCell("discount_platform") },
  { key: "biaya", header: "Biaya layanan", align: "right", cell: rupiahCell("service_fee") },
  { key: "total", header: "Total dibayar", align: "right", cell: rupiahCell("total") },
  { key: "toko-net", header: "Hak toko", align: "right", cell: rupiahCell("merchant_net") },
];

/**
 * Halaman rekap keuangan. Hak toko = subtotal dikurangi diskon promo toko; pendapatan platform = biaya layanan
 * dikurangi diskon promo platform (angka dihitung backend).
 * @param props.searchParams parameter URL: `dari` dan `sampai` (YYYY-MM-DD, WIB); kosong = hari ini
 * @returns PageHeader berisi pemilih rentang, 4 KPI, dan tabel per toko (atau LoadError)
 */
export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  // 1. Khusus admin super. Rentang yang tidak sah menjadi hari ini, dengan pesan galat untuk RangePicker.
  await requireAdmin("super");
  const params = await searchParams;
  const today = todayWib();
  const { from: startDate, to: endDate, error: rangeError } = parseRange(params.dari, params.sampai, today);
  // 2. Ambil rekap dari backend dan siapkan gaya tombol unduh CSV.
  const response = await getFinanceSummary({ from: startDate, to: endDate });
  const downloadClass = cx(
    "inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-subtle",
    focusRing,
  );

  return (
    <PageHeader title="Keuangan" description="Omzet, diskon, dan biaya layanan dari pesanan selesai, per toko.">
      <div className="flex flex-col gap-6">
        <RangePicker
          key={`${startDate}|${endDate}|${rangeError}`}
          from={startDate}
          to={endDate}
          today={today}
          error={rangeError}
        />
        {"error" in response ? (
          <LoadError
            title="Rekap keuangan belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total dibayar pembeli"
                icon={ReceiptText}
                value={formatRupiah(response.data.totals.total)}
                hint={`${response.data.totals.orders} pesanan selesai`}
              />
              <KpiCard
                label="Hak toko"
                icon={Store}
                value={formatRupiah(response.data.totals.merchant_net)}
                hint="Subtotal dikurangi diskon promo toko"
              />
              <KpiCard
                label="Pendapatan platform"
                icon={Landmark}
                value={formatRupiah(response.data.totals.platform_net)}
                hint="Biaya layanan dikurangi diskon promo platform"
              />
              <KpiCard
                label="Diskon promo"
                icon={Tag}
                value={formatRupiah(response.data.totals.discount_merchant + response.data.totals.discount_platform)}
                hint={`Toko ${formatRupiah(response.data.totals.discount_merchant)} · Platform ${formatRupiah(response.data.totals.discount_platform)}`}
              />
            </div>
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Per toko</h2>
                {response.data.rows.length > 0 && (
                  <a
                    href={`/api/admin/keuangan/csv?dari=${startDate}&sampai=${endDate}`}
                    download
                    className={downloadClass}
                  >
                    <Download aria-hidden className="size-4" />
                    Unduh CSV
                  </a>
                )}
              </div>
              {response.data.rows.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="Belum ada pesanan selesai di rentang ini"
                  body="Coba pilih rentang tanggal lain."
                />
              ) : (
                <DataTable
                  caption="Rekap keuangan per toko"
                  columns={COLUMNS}
                  rows={response.data.rows}
                  rowKey={(row) => String(row.merchant_id)}
                />
              )}
            </Card>
          </>
        )}
      </div>
    </PageHeader>
  );
}
