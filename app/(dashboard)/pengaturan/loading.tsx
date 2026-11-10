import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonBagian } from "@/app/components/ui/Skeleton";

// Navigasi bagian (atas di tablet, kiri di ≥ 1024 px) lalu bagian-bagian formulir.
export default function Loading() {
  return (
    <RangkaHalaman judul="Pengaturan toko" deskripsi="Atur profil, jam buka, titik temu, pembayaran, pesan dari meja, dan akun.">
      <div className="grid items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="flex flex-wrap gap-1 lg:flex-col">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="flex min-h-11 items-center px-3"><Skeleton className="h-3 w-20" /></div>)}
        </div>
        <div className="flex flex-col gap-6">
          <SkeletonBagian isian={4} />
          <SkeletonBagian isian={2} />
        </div>
      </div>
    </RangkaHalaman>
  );
}
