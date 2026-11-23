// Kerangka memuat /pesanan/[code]. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu
// data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonText } from "@/app/components/ui/Skeleton";
import { BackToOrders } from "../components/BackToOrders";

/**
 * Kerangka detail pesanan. Tautan kembali sudah asli sehingga bisa langsung diklik; judul (kode pesanan, berasal dari
 * data) dan rincian OrderDetail berupa kerangka.
 * @returns tautan kembali dan PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <>
      <BackToOrders />
      <PageFrame>
        <div className="flex max-w-2xl flex-col gap-6 rounded-lg border border-line bg-surface p-5">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="flex flex-col gap-3">
            <SkeletonText width="w-20" />
            <SkeletonText size="sm" width="w-56" />
            <SkeletonText size="sm" width="w-64" />
          </div>
          <div className="flex flex-col gap-3">
            <SkeletonText width="w-24" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex justify-between gap-3">
                <SkeletonText size="sm" width="w-44" />
                <SkeletonText size="sm" width="w-20" />
              </div>
            ))}
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex justify-between gap-3">
                  <SkeletonText size="sm" width="w-24" />
                  <SkeletonText size="sm" width="w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      </PageFrame>
    </>
  );
}
