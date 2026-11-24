// Kerangka memuat /admin/promo. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PromoListSkeleton } from "@/app/components/promo/PromoListSkeleton";
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonField, SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka promo dan biaya: dua formulir (biaya layanan, kontak CS) lalu daftar promo platform.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame title="Promo & biaya" description="Promo yang berlaku di semua toko dan biaya layanan per pesanan.">
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
              <SkeletonText size="lg" width="w-36" />
              <SkeletonText width="w-56" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="sm:w-64">
                  <SkeletonField />
                </div>
                <Skeleton className="h-11 w-24" />
              </div>
            </div>
          ))}
        </div>
        <PromoListSkeleton cardCount={3} />
      </div>
    </PageFrame>
  );
}
