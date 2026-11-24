// Kerangka memuat /copilot. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Card } from "@/app/components/ui/Card";
import {
  Skeleton,
  SkeletonField,
  SkeletonCard,
  SkeletonBox,
  SkeletonPills,
  SkeletonText,
} from "@/app/components/ui/Skeleton";

/**
 * Kerangka kalkulator HPP (baris bahan + hasil di kanan) lalu panel asisten AI.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Kalkulator HPP"
      description="Hitung modal per porsi dan saran harga jual, lalu tanyakan strategi ke asisten AI."
    >
      <div className="flex flex-col gap-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="flex flex-col gap-4">
            <SkeletonText size="lg" width="w-24" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_auto]">
                <SkeletonBox className="h-11" />
                <SkeletonBox className="h-11" />
                <SkeletonBox className="h-11" />
                <Skeleton className="size-11" />
              </div>
            ))}
            <Skeleton className="h-11 w-36" />
            <div className="max-w-xs">
              <SkeletonField />
            </div>
          </Card>
          <SkeletonCard lines={4} />
        </div>
        <Card className="flex flex-col gap-4">
          <SkeletonText size="lg" width="w-40" />
          <SkeletonText width="w-4/5" />
          <SkeletonPills count={3} />
          <SkeletonBox className="h-24" />
          <Skeleton className="h-11 w-28" />
        </Card>
      </div>
    </PageFrame>
  );
}
