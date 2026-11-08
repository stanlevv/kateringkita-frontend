import { Skeleton } from "@/app/components/ui/Skeleton";

// DB-S1: skeleton seukuran konten — KPI, 3 kartu antrean, 5 baris kuota.
export default function Loading() {
  return (
    <div role="status" aria-label="Memuat dashboard" className="flex flex-col gap-4">
      <div className="mb-2 flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full max-w-xl" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 md:max-xl:hidden">
          <Skeleton className="h-7 w-40" />
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    </div>
  );
}
