// Halaman /laporan: laporan penjualan toko untuk rentang tanggal (omzet, HPP, laba, grafik per jam, buku transaksi).
// Server component: kode berjalan di server, membaca searchParams (parameter URL ?dari=&sampai=&page=), lalu mengambil
// ringkasan, transaksi, dan data per jam dari backend lewat services/report.service.ts (GET /merchant/reports/...).
import { LoadError } from "@/app/components/LoadError";
import { HourlyChart } from "@/app/(dashboard)/laporan/components/HourlyChart";
import { RangePicker } from "@/app/components/ui/RangePicker";
import { ReportKpis } from "@/app/(dashboard)/laporan/components/ReportKpis";
import { TransactionTable } from "@/app/(dashboard)/laporan/components/TransactionTable";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { getHourly, getReportSummary, getTransactions } from "@/services/report.service";
import { countDays, LIMIT_TRANSACTIONS, parseRange, groupByHour } from "@/lib/report";
import { todayWib } from "@/lib/format";
import { requireMerchant } from "@/services/auth.service";

/**
 * Halaman laporan. Rentang dan halaman disimpan di URL, jadi tautan laporan bisa dibagikan dan tombol Back bekerja.
 * @param props.searchParams parameter URL: `dari` dan `sampai` (YYYY-MM-DD, WIB), `page` (halaman buku transaksi)
 * @returns PageHeader berisi pemilih rentang, KPI, grafik per jam, dan buku transaksi; atau LoadError bila data gagal
 * dimuat
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string; page?: string }>;
}) {
  // 1. Pastikan penjual sudah masuk, lalu baca rentang dari URL (rentang tidak sah menjadi hari ini + pesan galat).
  await requireMerchant();
  const params = await searchParams;
  const today = todayWib();
  const { from: startDate, to: endDate, error: rangeError } = parseRange(params.dari, params.sampai, today);
  const dayCount = countDays(startDate, endDate);
  const range = { from: startDate, to: endDate };

  // 2. Ambil ringkasan, transaksi, dan (khusus rentang satu hari) data per jam secara bersamaan.
  const [summary, transactions, hourly] = await Promise.all([
    getReportSummary(range),
    getTransactions(range),
    dayCount === 1 ? getHourly({ date: startDate }) : null,
  ]);

  const rangePicker = (
    <RangePicker
      key={`${startDate}|${endDate}|${rangeError}`}
      from={startDate}
      to={endDate}
      today={today}
      error={rangeError}
    />
  );
  // 3. Salah satu gagal: tetap tampilkan pemilih rentang agar penjual bisa mencoba rentang lain.
  if ("error" in summary || "error" in transactions || (hourly && "error" in hourly)) {
    return (
      <PageHeader title="Laporan" description="Omzet, modal bahan, dan laba bersih toko Anda.">
        <div className="flex flex-col gap-6">
          {rangePicker}
          <LoadError
            title="Laporan belum bisa dimuat"
            body="Terjadi kesalahan saat mengambil data laporan. Periksa koneksi lalu coba lagi."
          />
        </div>
      </PageHeader>
    );
  }

  // 4. Buku transaksi dipotong per halaman di sini; nomor halaman dijepit ke 1 sampai halaman terakhir.
  //    Untuk rentang lebih dari satu hari, grafik per jam dijumlahkan dari daftar transaksi (groupByHour).
  const allTransactions = transactions.data;
  const currentPage = Math.min(
    Math.max(1, Math.floor(Number(params.page)) || 1),
    Math.max(1, Math.ceil(allTransactions.length / LIMIT_TRANSACTIONS)),
  );
  const rows = allTransactions.slice((currentPage - 1) * LIMIT_TRANSACTIONS, currentPage * LIMIT_TRANSACTIONS);

  return (
    <PageHeader title="Laporan" description="Omzet, modal bahan, dan laba bersih toko Anda.">
      <div className="flex flex-col gap-6">
        {rangePicker}
        <ReportKpis summary={summary.data} />
        <HourlyChart points={hourly && "data" in hourly ? hourly.data : groupByHour(allTransactions)} days={dayCount} />
        <TransactionTable
          rows={rows}
          total={allTransactions.length}
          page={currentPage}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </PageHeader>
  );
}
