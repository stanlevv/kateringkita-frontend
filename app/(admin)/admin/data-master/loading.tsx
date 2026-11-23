// Kerangka memuat /admin/data-master. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonTabs, SkeletonTable } from "@/app/components/ui/Skeleton";

/**
 * Kerangka MasterTable: tab jenis data, tombol tambah, lalu tabel.
 * @returns PageFrame berisi kerangka
 */
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
