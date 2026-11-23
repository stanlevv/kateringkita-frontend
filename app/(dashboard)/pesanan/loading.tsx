import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList, SkeletonFilter } from "@/app/components/ui/Skeleton";

// PS-S1: filter (cari, tanggal, status) lalu tabel (≥ 1024 px) atau kartu.
export default function Loading() {
  return (
    <PageFrame title="Pesanan">
      <div className="flex flex-col gap-4">
        <SkeletonFilter selectWidths={["md:w-44", "md:w-48"]} />
        <SkeletonList columns={6} />
      </div>
    </PageFrame>
  );
}
