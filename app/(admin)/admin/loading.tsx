import { PageFrame } from "@/app/components/shell/PageFrame";
import { Card } from "@/app/components/ui/Card";
import { SkeletonCard, SkeletonKpi, SkeletonText } from "@/app/components/ui/Skeleton";

// G-1 Ringkasan: pesanan hari ini + 2 KPI, 5 ubin penjual, aksi admin terakhir. Halaman admin lain punya loading.tsx
// sendiri (dijaga test/page-skeleton.test.ts), jadi kerangka ini tidak muncul di halaman yang salah.
export default function Loading() {
  return (
    <PageFrame title="Ringkasan" description="Kondisi platform hari ini (WIB).">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SkeletonText size="lg" width="w-40" />
            <ul className="mt-3 flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <SkeletonText width="w-32" />
                  <SkeletonText size="lg" width="w-10" />
                </li>
              ))}
            </ul>
          </Card>
          <div className="flex flex-col gap-4">
            <SkeletonKpi />
            <SkeletonKpi />
          </div>
        </div>
        <div>
          <SkeletonText size="lg" width="w-24" className="mb-3" />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <SkeletonText size="sm" width="w-24" />
                <SkeletonText size="2xl" width="w-12" className="mt-1" />
              </Card>
            ))}
          </div>
        </div>
        <SkeletonCard lines={4} />
      </div>
    </PageFrame>
  );
}
