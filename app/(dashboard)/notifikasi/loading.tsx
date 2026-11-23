import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonTeks } from "@/app/components/ui/Skeleton";

// Daftar notifikasi: ikon, judul, isi dua baris, waktu
export default function Loading() {
  return (
    <RangkaHalaman judul="Notifikasi" deskripsi="Pengumuman dari admin dan kabar tentang toko kamu.">
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex gap-3 p-4">
            <Skeleton className="size-5 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2"><SkeletonTeks lebar="w-48" /><SkeletonTeks ukuran="sm" lebar="w-full" /><SkeletonTeks ukuran="sm" lebar="w-24" /></div>
          </li>
        ))}
      </ul>
    </RangkaHalaman>
  );
}
