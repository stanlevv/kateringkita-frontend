// Kerangka memuat /dashboard. loading.tsx = file khusus Next.js yang tampil otomatis selama page.tsx menunggu data.
// Bentuknya meniru halaman asli: 4 KPI, tab antrean dengan kartu pesanan, panel kuota dan menu terlaris.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonCard, SkeletonKpi, SkeletonTabs, SkeletonText } from "@/app/components/ui/Skeleton";

/**
 * Kerangka satu kartu pesanan, meniru OrderCard: kode dan jam, pembeli, item, titik temu, total dan tombol.
 * @returns elemen `div`
 */
function OrderCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 pt-5">
      <div className="flex justify-between gap-2">
        <SkeletonText size="sm" width="w-20" />
        <SkeletonText size="sm" width="w-24" />
      </div>
      <SkeletonText width="w-48" />
      <div className="flex flex-col gap-1">
        <SkeletonText width="w-40" />
        <SkeletonText width="w-28" />
      </div>
      <SkeletonText size="sm" width="w-36" />
      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonText width="w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </div>
  );
}

/**
 * Kerangka halaman dashboard. Panel kuota dan menu terlaris hanya tampil di layar ≥ 1280 px; di tablet panel itu
 * menjadi tab di antrean.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Dashboard"
      description="Antrean pesanan dan kuota hari ini"
      actions={<Skeleton className="size-11" />}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex flex-col gap-4">
            <SkeletonTabs />
            <div className="grid gap-4 2xl:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="hidden flex-col gap-4 xl:flex">
            <div className="rounded-lg border border-line bg-surface p-4">
              <SkeletonText size="lg" width="w-36" />
              <ul className="mt-1">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
                    <SkeletonText width="w-36" />
                    <SkeletonText size="sm" width="w-52" />
                    <Skeleton className="h-11 w-46" />
                  </li>
                ))}
              </ul>
            </div>
            <SkeletonCard lines={1} />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
