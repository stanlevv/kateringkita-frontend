import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Card } from "@/app/components/ui/Card";
import { Skeleton, SkeletonIsian, SkeletonKartu, SkeletonKotak, SkeletonPil, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Kalkulator HPP (baris bahan + hasil di kanan) lalu panel asisten AI.
export default function Loading() {
  return (
    <RangkaHalaman judul="Kalkulator HPP" deskripsi="Hitung modal per porsi dan saran harga jual, lalu tanyakan strategi ke asisten AI.">
      <div className="flex flex-col gap-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="flex flex-col gap-4">
            <SkeletonTeks ukuran="lg" lebar="w-24" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_auto]">
                <SkeletonKotak className="h-11" /><SkeletonKotak className="h-11" /><SkeletonKotak className="h-11" /><Skeleton className="size-11" />
              </div>
            ))}
            <Skeleton className="h-11 w-36" />
            <div className="max-w-xs"><SkeletonIsian /></div>
          </Card>
          <SkeletonKartu baris={4} />
        </div>
        <Card className="flex flex-col gap-4">
          <SkeletonTeks ukuran="lg" lebar="w-40" />
          <SkeletonTeks lebar="w-4/5" />
          <SkeletonPil jumlah={3} />
          <SkeletonKotak className="h-24" />
          <Skeleton className="h-11 w-28" />
        </Card>
      </div>
    </RangkaHalaman>
  );
}
