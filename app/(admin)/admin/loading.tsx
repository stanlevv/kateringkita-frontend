import { Skeleton } from "@/components/ui/Skeleton";

// G-1 memuat: kerangka umum segmen admin.
export default function Loading() {
  return (
    <div role="status" aria-label="Memuat halaman" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    </div>
  );
}
