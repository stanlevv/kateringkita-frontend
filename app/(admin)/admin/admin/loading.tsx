import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonTabel } from "@/app/components/ui/Skeleton";

// AdminTable: tombol tambah + tabel admin (nama, tingkat, status, terakhir masuk, aksi).
export default function Loading() {
  return (
    <RangkaHalaman judul="Kelola admin" deskripsi="Tambah admin, atur tingkat akses, nonaktifkan, atau reset kata sandi. Semua perubahan tercatat di Log.">
      <div className="flex flex-col gap-4">
        <div><Skeleton className="h-11 w-36" /></div>
        <SkeletonTabel baris={3} kolom={5} />
      </div>
    </RangkaHalaman>
  );
}
