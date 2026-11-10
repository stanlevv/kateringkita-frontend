import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonDaftar, SkeletonGrafik, SkeletonKpi, SkeletonPil, SkeletonTeks } from "@/app/components/ui/Skeleton";
import { Card } from "@/app/components/ui/Card";

// Pemilih rentang, 4 KPI, grafik per jam (rasio SVG 640:240), buku transaksi.
export default function Loading() {
  return (
    <RangkaHalaman judul="Laporan" deskripsi="Omzet, modal bahan, dan laba bersih toko Anda.">
      <div className="flex flex-col gap-6">
        <SkeletonPil jumlah={5} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonKpi key={i} />)}</div>
        <Card className="flex flex-col gap-3">
          <div><SkeletonTeks ukuran="lg" lebar="w-44" /><SkeletonTeks ukuran="sm" lebar="w-64" /></div>
          <SkeletonGrafik batang={14} className="aspect-[8/3] pl-[14%]" />
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3"><SkeletonTeks ukuran="lg" lebar="w-36" /><Skeleton className="h-11 w-32" /></div>
          <SkeletonDaftar kolom={5} />
        </Card>
      </div>
    </RangkaHalaman>
  );
}
