// Komponen PromoListSkeleton: kerangka memuat untuk PromoList, dipakai loading.tsx di /promo dan /admin/promo.
import { Skeleton, SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka PromoList: tombol "Buat promo" dan grid kartu.
 * @param props.cardCount jumlah kartu kerangka (bawaan 6)
 * @returns kerangka
 */
export function PromoListSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
            <div className="flex justify-between gap-2">
              <SkeletonText size="lg" width="w-28" />
              <Skeleton className="h-6 w-16" />
            </div>
            <SkeletonText width="w-4/5" />
            <SkeletonText width="w-40" />
            <div className="flex flex-col gap-1">
              <SkeletonText size="sm" width="w-36" />
              <SkeletonText size="sm" width="w-48" />
              <SkeletonText size="sm" width="w-24" />
            </div>
            <div className="mt-auto flex gap-2 pt-1">
              <Skeleton className="h-11 w-20" />
              <Skeleton className="h-11 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
