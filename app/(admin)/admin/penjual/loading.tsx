import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonDaftar, SkeletonFilter } from "@/app/components/ui/Skeleton";

// MerchantTable: cari + status + dapur, lalu tabel (≥ 1024 px) atau kartu.
export default function Loading() {
  return (
    <RangkaHalaman judul="Penjual" deskripsi="Semua penjual yang terdaftar.">
      <div className="flex flex-col gap-4">
        <SkeletonFilter pilihan={["md:w-48", "md:w-40"]} />
        <SkeletonDaftar kolom={5} />
      </div>
    </RangkaHalaman>
  );
}
