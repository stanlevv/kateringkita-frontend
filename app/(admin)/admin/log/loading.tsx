import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { SkeletonIsian, SkeletonTabel } from "@/app/components/ui/Skeleton";

// LogFilters (4 isian) lalu tabel log.
export default function Loading() {
  return (
    <RangkaHalaman judul="Log aksi admin" deskripsi="Setiap perubahan oleh admin tercatat di sini. Hanya untuk dibaca.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonIsian key={i} label="w-20" />)}</div>
      <SkeletonTabel baris={8} kolom={5} />
    </RangkaHalaman>
  );
}
