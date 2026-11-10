import { Skeleton, SkeletonTeks } from "@/app/components/ui/Skeleton";

/** Kerangka PromoList (tombol "Buat promo" + grid kartu). Dipakai /promo dan /admin/promo. */
export function RangkaPromo({ kartu = 6 }: { kartu?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Skeleton className="h-11 w-36" /></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: kartu }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
            <div className="flex justify-between gap-2"><SkeletonTeks ukuran="lg" lebar="w-28" /><Skeleton className="h-6 w-16" /></div>
            <SkeletonTeks lebar="w-4/5" />
            <SkeletonTeks lebar="w-40" />
            <div className="flex flex-col gap-1">
              <SkeletonTeks ukuran="sm" lebar="w-36" />
              <SkeletonTeks ukuran="sm" lebar="w-48" />
              <SkeletonTeks ukuran="sm" lebar="w-24" />
            </div>
            <div className="mt-auto flex gap-2 pt-1"><Skeleton className="h-11 w-20" /><Skeleton className="h-11 w-32" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
