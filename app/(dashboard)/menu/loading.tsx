import { Skeleton } from "@/components/ui/Skeleton";

// MN-S3: kerangka judul, filter, dan kartu.
export default function Loading() {
  return (
    <div role="status" aria-label="Memuat menu" className="flex flex-col gap-4">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full max-w-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-80" />)}
      </div>
    </div>
  );
}
