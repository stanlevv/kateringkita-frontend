import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonTabs, SkeletonTable } from "@/app/components/ui/Skeleton";

// MasterTable: tab jenis data, tombol tambah, tabel.
export default function Loading() {
  return (
    <PageFrame
      title="Data master"
      description="Kategori menu, titik temu, dan jenis usaha. Data tidak dihapus, hanya dinonaktifkan."
    >
      <div className="flex flex-col gap-4">
        <SkeletonTabs />
        <div>
          <Skeleton className="h-11 w-40" />
        </div>
        <SkeletonTable rows={6} columns={3} />
      </div>
    </PageFrame>
  );
}
