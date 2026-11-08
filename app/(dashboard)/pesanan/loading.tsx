import { Skeleton } from "@/app/components/ui/Skeleton";

// PS-S1: kerangka judul, filter, dan baris.
export default function Loading() {
  return (
    <div role="status" aria-label="Memuat pesanan" className="flex flex-col gap-4">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="h-11 w-full" />
      {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}
