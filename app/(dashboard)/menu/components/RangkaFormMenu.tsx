import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonSection, SkeletonText } from "@/app/components/ui/Skeleton";

/** Kerangka MenuForm: bagian-bagian formulir + tombol simpan, pratinjau pembeli di kanan (≥ 1280 px). */
export function RangkaFormMenu({ judul }: { judul: string }) {
  return (
    <PageFrame title={judul}>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <SkeletonSection fields={4} />
          <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
            <SkeletonText size="lg" width="w-20" />
            <div className="aspect-[16/9] w-full max-w-sm rounded-md bg-subtle" />
          </div>
          <SkeletonSection fields={2} />
          <div className="flex justify-end">
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
        <div className="hidden xl:block">
          <SkeletonText size="sm" width="w-40" className="mb-2" />
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="aspect-video bg-subtle" />
            <div className="flex flex-col gap-1 p-4">
              <SkeletonText width="w-40" />
              <SkeletonText size="sm" width="w-24" />
              <SkeletonText width="w-28" />
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
