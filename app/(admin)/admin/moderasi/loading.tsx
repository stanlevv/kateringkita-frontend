import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonBox, SkeletonPills, SkeletonTable } from "@/app/components/ui/Skeleton";

// Pil jenis, pil status + cari, lalu tabel moderasi.
export default function Loading() {
  return (
    <PageFrame
      title="Moderasi"
      description="Sembunyikan ulasan atau turunkan menu yang melanggar. Untuk menangguhkan toko, buka halaman Penjual."
    >
      <div className="flex flex-col gap-4">
        <SkeletonPills count={2} />
        <div className="flex flex-wrap items-end gap-3">
          <SkeletonPills count={3} />
          <SkeletonBox className="h-11 w-60" />
        </div>
        <SkeletonTable rows={6} columns={5} />
      </div>
    </PageFrame>
  );
}
