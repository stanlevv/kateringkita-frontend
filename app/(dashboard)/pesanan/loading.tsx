import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonDaftar, SkeletonFilter } from "@/app/components/ui/Skeleton";

// PS-S1: filter (cari, tanggal, status) lalu tabel (≥ 1024 px) atau kartu.
export default function Loading() {
  return (
    <RangkaHalaman judul="Pesanan">
      <div className="flex flex-col gap-4">
        <SkeletonFilter pilihan={["md:w-44", "md:w-48"]} />
        <SkeletonDaftar kolom={6} />
      </div>
    </RangkaHalaman>
  );
}
