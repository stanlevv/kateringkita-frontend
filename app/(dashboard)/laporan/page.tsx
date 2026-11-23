import { GagalMuat } from "@/app/components/GagalMuat";
import { HourlyChart } from "@/app/(dashboard)/laporan/components/HourlyChart";
import { RangePicker } from "@/app/components/ui/RangePicker";
import { ReportKpis } from "@/app/(dashboard)/laporan/components/ReportKpis";
import { TransactionTable } from "@/app/(dashboard)/laporan/components/TransactionTable";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getHourly, getReportSummary, getTransactions } from "@/services/report.service";
import { countDays, LIMIT_TRANSACTIONS, parseRange, groupByHour } from "@/lib/report";
import { todayWib } from "@/lib/format";
import { requireMerchant } from "@/services/auth.service";

// M-09 — Laporan (LP-N1..N3, LP-E1, LP-A1, LP-S1). Rentang dan halaman ada di URL: ?dari&sampai&page.
export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string; page?: string }>;
}) {
  await requireMerchant();
  const sp = await searchParams;
  const hariIni = todayWib();
  const { from: dari, to: sampai, error: galat } = parseRange(sp.dari, sp.sampai, hariIni);
  const hari = countDays(dari, sampai);
  const rentang = { from: dari, to: sampai };

  const [ringkasan, transaksi, perHari] = await Promise.all([
    getReportSummary(rentang),
    getTransactions(rentang),
    hari === 1 ? getHourly({ date: dari }) : null,
  ]);

  const picker = (
    <RangePicker key={`${dari}|${sampai}|${galat}`} from={dari} to={sampai} today={hariIni} error={galat} />
  );
  if ("error" in ringkasan || "error" in transaksi || (perHari && "error" in perHari)) {
    return (
      <PageHeader title="Laporan" description="Omzet, modal bahan, dan laba bersih toko Anda.">
        <div className="flex flex-col gap-6">
          {picker}
          <GagalMuat
            judul="Laporan belum bisa dimuat"
            isi="Terjadi kesalahan saat mengambil data laporan. Periksa koneksi lalu coba lagi."
          />
        </div>
      </PageHeader>
    );
  }

  const semua = transaksi.data;
  const halaman = Math.min(
    Math.max(1, Math.floor(Number(sp.page)) || 1),
    Math.max(1, Math.ceil(semua.length / LIMIT_TRANSACTIONS)),
  );
  const rows = semua.slice((halaman - 1) * LIMIT_TRANSACTIONS, halaman * LIMIT_TRANSACTIONS);

  return (
    <PageHeader title="Laporan" description="Omzet, modal bahan, dan laba bersih toko Anda.">
      <div className="flex flex-col gap-6">
        {picker}
        <ReportKpis summary={ringkasan.data} />
        <HourlyChart points={perHari && "data" in perHari ? perHari.data : groupByHour(semua)} hari={hari} />
        <TransactionTable rows={rows} total={semua.length} page={halaman} dari={dari} sampai={sampai} />
      </div>
    </PageHeader>
  );
}
