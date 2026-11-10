import { RangkaHalaman } from "@/app/components/shell/RangkaHalaman";
import { Skeleton, SkeletonBagian, SkeletonTeks } from "@/app/components/ui/Skeleton";

/** Kerangka MenuForm: bagian-bagian formulir + tombol simpan, pratinjau pembeli di kanan (≥ 1280 px). */
export function RangkaFormMenu({ judul }: { judul: string }) {
  return (
    <RangkaHalaman judul={judul}>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <SkeletonBagian isian={4} />
          <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
            <SkeletonTeks ukuran="lg" lebar="w-20" />
            <div className="aspect-[16/9] w-full max-w-sm rounded-md bg-subtle" />
          </div>
          <SkeletonBagian isian={2} />
          <div className="flex justify-end"><Skeleton className="h-12 w-40" /></div>
        </div>
        <div className="hidden xl:block">
          <SkeletonTeks ukuran="sm" lebar="w-40" className="mb-2" />
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="aspect-video bg-subtle" />
            <div className="flex flex-col gap-1 p-4"><SkeletonTeks lebar="w-40" /><SkeletonTeks ukuran="sm" lebar="w-24" /><SkeletonTeks lebar="w-28" /></div>
          </div>
        </div>
      </div>
    </RangkaHalaman>
  );
}
