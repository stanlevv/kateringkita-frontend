import { RangkaPromo } from "@/app/components/promo/RangkaPromo";
import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonIsian, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Dua formulir (biaya layanan, kontak CS) lalu daftar promo platform.
export default function Loading() {
  return (
    <RangkaHalaman judul="Promo & biaya" deskripsi="Promo yang berlaku di semua toko dan biaya layanan per pesanan.">
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
              <SkeletonTeks ukuran="lg" lebar="w-36" />
              <SkeletonTeks lebar="w-56" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="sm:w-64"><SkeletonIsian /></div><Skeleton className="h-11 w-24" /></div>
            </div>
          ))}
        </div>
        <RangkaPromo kartu={3} />
      </div>
    </RangkaHalaman>
  );
}
