import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonPil, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Ringkasan rating (angka + 5 baris bintang), lalu rating per menu di kiri dan daftar ulasan di kanan.
export default function Loading() {
  return (
    <RangkaHalaman judul="Ulasan">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex flex-col gap-1"><SkeletonTeks ukuran="4xl" lebar="w-16" /><Skeleton className="h-4 w-24" /><SkeletonTeks lebar="w-28" /></div>
          <ul className="flex flex-1 flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <SkeletonTeks ukuran="sm" lebar="w-16" className="w-20 shrink-0" />
                <span className="h-2 flex-1 rounded-full bg-subtle" />
                <SkeletonTeks ukuran="sm" lebar="w-6" className="w-8 shrink-0 items-end" />
              </li>
            ))}
          </ul>
        </div>
        <div className="grid items-start gap-6 md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex min-h-11 items-center justify-between gap-2 px-3"><SkeletonTeks lebar="w-32" /><SkeletonTeks ukuran="sm" lebar="w-16" /></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <SkeletonPil jumlah={6} />
            <ul className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-2"><Skeleton className="h-4 w-24" /><SkeletonTeks ukuran="sm" lebar="w-20" /></div>
                  <SkeletonTeks lebar="w-4/5" />
                  <SkeletonTeks ukuran="sm" lebar="w-40" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </RangkaHalaman>
  );
}
