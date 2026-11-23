import { PageFrame } from "@/app/components/shell/PageFrame";
import { Card } from "@/app/components/ui/Card";
import { SkeletonFilter, SkeletonChart, SkeletonKpi, SkeletonTable, SkeletonText } from "@/app/components/ui/Skeleton";

// 4 KPI, grafik per jam (GrafikBatang: 24 batang, area 160 px di bawah ruang tooltip 40 px), lalu log (filter + tabel).
export default function Loading() {
  return (
    <PageFrame title="Server" description="Kondisi backend, error 5xx, dan request lambat. Log disimpan 30 hari.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <Card className="flex flex-col gap-4">
          <div>
            <SkeletonText size="lg" width="w-40" />
            <SkeletonText size="sm" width="w-48" />
          </div>
          <SkeletonChart bars={24} className="mt-10 h-40" />
        </Card>
        <div className="flex flex-col gap-4">
          <SkeletonText size="lg" width="w-12" />
          <SkeletonFilter selectWidths={["md:w-48"]} />
          <SkeletonTable rows={8} columns={6} />
        </div>
      </div>
    </PageFrame>
  );
}
