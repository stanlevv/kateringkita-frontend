import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Card } from "@/app/components/ui/Card";
import { SkeletonFilter, SkeletonGrafik, SkeletonKpi, SkeletonTabel, SkeletonTeks } from "@/app/components/ui/Skeleton";

// 4 KPI, grafik per jam (GrafikBatang: 24 batang, area 160 px di bawah ruang tooltip 40 px), lalu log (filter + tabel).
export default function Loading() {
  return (
    <RangkaHalaman judul="Server" deskripsi="Kondisi backend, error 5xx, dan request lambat. Log disimpan 30 hari.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonKpi key={i} />)}</div>
        <Card className="flex flex-col gap-4">
          <div><SkeletonTeks ukuran="lg" lebar="w-40" /><SkeletonTeks ukuran="sm" lebar="w-48" /></div>
          <SkeletonGrafik batang={24} className="mt-10 h-40" />
        </Card>
        <div className="flex flex-col gap-4">
          <SkeletonTeks ukuran="lg" lebar="w-12" />
          <SkeletonFilter pilihan={["md:w-48"]} />
          <SkeletonTabel baris={8} kolom={6} />
        </div>
      </div>
    </RangkaHalaman>
  );
}
