import { GagalMuat } from "@/components/dashboard/GagalMuat";
import { HourlyChart } from "@/components/reports/HourlyChart";
import { RangePicker } from "@/components/reports/RangePicker";
import { ReportKpis } from "@/components/reports/ReportKpis";
import { LIMIT_TRANSAKSI, TransactionTable } from "@/components/reports/TransactionTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { getHourly, getReportSummary, getTransactions } from "@/lib/data/reports";
import { getProfile } from "@/lib/data/profile";
import { jumlahHari, parseRentang, perJam } from "@/lib/laporan";
import { hariIniWib } from "@/lib/format";
import { requireMerchant } from "@/lib/session";

// M-09 — Laporan (LP-N1..N3, LP-E1, LP-A1, LP-S1). Rentang dan halaman ada di URL: ?dari&sampai&page.
export default async function LaporanPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string; page?: string }> }) {
  await requireMerchant();
  const sp = await searchParams;
  const hariIni = hariIniWib();
  const { dari, sampai, galat } = parseRentang(sp.dari, sp.sampai, hariIni);
  const hari = jumlahHari(dari, sampai);
  const rentang = { from: dari, to: sampai };

  const [ringkasan, transaksi, profil, perHari] = await Promise.all([
    getReportSummary(rentang),
    getTransactions(rentang),
    getProfile(),
    hari === 1 ? getHourly({ date: dari }) : null,
  ]);

  const picker = <RangePicker key={`${dari}|${sampai}|${galat}`} dari={dari} sampai={sampai} hariIni={hariIni} galat={galat} />;
  if ("error" in ringkasan || "error" in transaksi || "error" in profil || (perHari && "error" in perHari)) {
    return (
      <PageHeader title="Laporan" description="Omzet, modal bahan, dan laba bersih toko Anda.">
        <div className="flex flex-col gap-6">
          {picker}
          <GagalMuat judul="Laporan belum bisa dimuat" isi="Terjadi kesalahan saat mengambil data laporan. Periksa koneksi lalu coba lagi." />
        </div>
      </PageHeader>
    );
  }

  const semua = transaksi.data;
  const halaman = Math.min(Math.max(1, Math.floor(Number(sp.page)) || 1), Math.max(1, Math.ceil(semua.length / LIMIT_TRANSAKSI)));
  const rows = semua.slice((halaman - 1) * LIMIT_TRANSAKSI, halaman * LIMIT_TRANSAKSI);

  return (
    <PageHeader title="Laporan" description="Omzet, modal bahan, dan laba bersih toko Anda.">
      <div className="flex flex-col gap-6">
        {picker}
        {/* shortcut: target = target harian x hari dihitung di sini; F09 memakai summary.target dan achievement_pct dari API. selesai = jumlah baris transaksi, menganggap setiap baris pesanan selesai. */}
        <ReportKpis summary={ringkasan.data} targetHarian={profil.data.daily_revenue_target} hari={hari} selesai={semua.length} />
        <HourlyChart points={perHari && "data" in perHari ? perHari.data : perJam(semua)} hari={hari} />
        <TransactionTable rows={rows} total={semua.length} page={halaman} dari={dari} sampai={sampai} />
      </div>
    </PageHeader>
  );
}
