import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonIsian } from "@/app/components/ui/Skeleton";

// PengumumanForm: tujuan, judul, isi (3 baris), tombol kirim.
export default function Loading() {
  return (
    <RangkaHalaman judul="Pengumuman" deskripsi="Kirim pengumuman ke notifikasi aplikasi pembeli dan penjual.">
      <div className="flex max-w-2xl flex-col gap-4 rounded-lg border border-line bg-surface p-4">
        <SkeletonIsian label="w-20" />
        <SkeletonIsian label="w-12" />
        <SkeletonIsian label="w-10" tinggi="h-24" />
        <div><Skeleton className="h-11 w-40" /></div>
      </div>
    </RangkaHalaman>
  );
}
