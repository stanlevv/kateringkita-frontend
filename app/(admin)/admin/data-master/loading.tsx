import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonTab, SkeletonTabel } from "@/app/components/ui/Skeleton";

// MasterTable: tab jenis data, tombol tambah, tabel.
export default function Loading() {
  return (
    <RangkaHalaman judul="Data master" deskripsi="Kategori menu, titik temu, dan jenis usaha. Data tidak dihapus, hanya dinonaktifkan.">
      <div className="flex flex-col gap-4">
        <SkeletonTab />
        <div><Skeleton className="h-11 w-40" /></div>
        <SkeletonTabel baris={6} kolom={3} />
      </div>
    </RangkaHalaman>
  );
}
