import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonIsian, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Data akun (3 baris) + ChangePasswordForm (3 isian + tombol).
export default function Loading() {
  return (
    <RangkaHalaman judul="Pengaturan akun" deskripsi="Ganti kata sandi akun admin Anda.">
      <div className="flex max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2"><SkeletonTeks lebar="w-48" /><SkeletonTeks lebar="w-40" /><SkeletonTeks lebar="w-32" /></div>
        <div className="flex flex-col gap-4">
          <SkeletonIsian label="w-28" /><SkeletonIsian label="w-28" /><SkeletonIsian label="w-40" />
          <div><Skeleton className="h-11 w-40" /></div>
        </div>
      </div>
    </RangkaHalaman>
  );
}
