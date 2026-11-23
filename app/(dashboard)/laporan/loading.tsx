import { PageFrame } from "@/app/components/shell/PageFrame";
import {
  Skeleton,
  SkeletonList,
  SkeletonChart,
  SkeletonKpi,
  SkeletonPills,
  SkeletonText,
} from "@/app/components/ui/Skeleton";
import { Card } from "@/app/components/ui/Card";

// Pemilih rentang, 4 KPI, grafik per jam (rasio SVG 640:240), buku transaksi.
export default function Loading() {
  return (
    <PageFrame title="Laporan" description="Omzet, modal bahan, dan laba bersih toko Anda.">
      <div className="flex flex-col gap-6">
        <SkeletonPills count={5} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <Card className="flex flex-col gap-3">
          <div>
            <SkeletonText size="lg" width="w-44" />
            <SkeletonText size="sm" width="w-64" />
          </div>
          <SkeletonChart bars={14} className="aspect-[8/3] pl-[14%]" />
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <SkeletonText size="lg" width="w-36" />
            <Skeleton className="h-11 w-32" />
          </div>
          <SkeletonList columns={5} />
        </Card>
      </div>
    </PageFrame>
  );
}
