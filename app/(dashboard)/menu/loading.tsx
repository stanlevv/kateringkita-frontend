import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { LinkButton } from "@/app/components/ui/LinkButton";
import { Skeleton, SkeletonKotak, SkeletonTab, SkeletonTeks } from "@/app/components/ui/Skeleton";

// MN-S3: cari + kategori, tab status, lalu kartu MenuCard (foto 16:9, nama, harga, stok, stepper kuota, tombol).
export default function Loading() {
  return (
    <RangkaHalaman judul="Menu & Stok" aksi={<LinkButton href="/menu/baru">Tambah menu</LinkButton>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SkeletonKotak className="h-11 flex-1" />
          <SkeletonKotak className="h-11 sm:w-56" />
        </div>
        <SkeletonTab />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
              <div className="aspect-[16/9] bg-subtle" />
              <div className="flex flex-col gap-3 p-4">
                <div><SkeletonTeks lebar="w-40" /><SkeletonTeks ukuran="sm" lebar="w-24" /></div>
                <SkeletonTeks lebar="w-48" />
                <SkeletonTeks ukuran="sm" lebar="w-56" />
                <Skeleton className="h-11 w-46" />
                <div className="flex gap-2 pt-1"><Skeleton className="h-11 w-24" /><Skeleton className="h-11 w-32" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RangkaHalaman>
  );
}
