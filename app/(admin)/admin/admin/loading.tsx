import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonTable } from "@/app/components/ui/Skeleton";

// AdminTable: tombol tambah + tabel admin (nama, tingkat, status, terakhir masuk, aksi).
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
