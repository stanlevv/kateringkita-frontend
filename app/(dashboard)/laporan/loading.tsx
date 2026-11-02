import { Skeleton } from "@/components/ui/Skeleton";

// Kerangka judul, pemilih rentang, kartu angka, grafik, dan tabel.
export default function Loading() {
  return (
    <div role="status" aria-label="Memuat laporan" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-11 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
