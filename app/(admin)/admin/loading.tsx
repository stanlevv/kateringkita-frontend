import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Card } from "@/app/components/ui/Card";
import { SkeletonKartu, SkeletonKpi, SkeletonTeks } from "@/app/components/ui/Skeleton";

// G-1 Ringkasan: pesanan hari ini + 2 KPI, 5 ubin penjual, aksi admin terakhir. Halaman admin lain punya loading.tsx
// sendiri (dijaga test/rangka.test.ts), jadi kerangka ini tidak muncul di halaman yang salah.
export default function Loading() {
  return (
    <RangkaHalaman judul="Ringkasan" deskripsi="Kondisi platform hari ini (WIB).">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SkeletonTeks ukuran="lg" lebar="w-40" />
            <ul className="mt-3 flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center justify-between gap-3"><SkeletonTeks lebar="w-32" /><SkeletonTeks ukuran="lg" lebar="w-10" /></li>
              ))}
            </ul>
          </Card>
          <div className="flex flex-col gap-4"><SkeletonKpi /><SkeletonKpi /></div>
        </div>
        <div>
          <SkeletonTeks ukuran="lg" lebar="w-24" className="mb-3" />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Card key={i}><SkeletonTeks ukuran="sm" lebar="w-24" /><SkeletonTeks ukuran="2xl" lebar="w-12" className="mt-1" /></Card>
            ))}
          </div>
        </div>
        <SkeletonKartu baris={4} />
      </div>
    </RangkaHalaman>
  );
}
