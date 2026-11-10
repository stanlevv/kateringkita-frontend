import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Card } from "@/app/components/ui/Card";
import { Skeleton, SkeletonKpi, SkeletonPil, SkeletonTabel, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Pemilih rentang, 4 KPI, tabel per toko + unduh CSV.
export default function Loading() {
  return (
    <RangkaHalaman judul="Keuangan" deskripsi="Omzet, diskon, dan biaya layanan dari pesanan selesai, per toko.">
      <div className="flex flex-col gap-6">
        <SkeletonPil jumlah={5} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonKpi key={i} />)}</div>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3"><SkeletonTeks ukuran="lg" lebar="w-24" /><Skeleton className="h-11 w-32" /></div>
          <SkeletonTabel baris={6} kolom={6} />
        </Card>
      </div>
    </RangkaHalaman>
  );
}
