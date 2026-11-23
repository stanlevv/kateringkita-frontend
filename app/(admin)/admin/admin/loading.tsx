// Kerangka memuat /admin/admin (kelola admin). loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonTable } from "@/app/components/ui/Skeleton";

/**
 * Kerangka AdminTable: tombol tambah dan tabel admin (nama, tingkat, status, terakhir masuk, aksi).
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Kelola admin"
      description="Tambah admin, atur tingkat akses, nonaktifkan, atau reset kata sandi. Semua perubahan tercatat di Log."
    >
      <div className="flex flex-col gap-4">
        <div>
          <Skeleton className="h-11 w-36" />
        </div>
        <SkeletonTable rows={3} columns={5} />
      </div>
    </PageFrame>
  );
}
