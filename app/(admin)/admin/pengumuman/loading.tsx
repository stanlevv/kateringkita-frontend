// Kerangka memuat /admin/pengumuman. loading.tsx tampil otomatis selama page.tsx menunggu data.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { Skeleton, SkeletonField } from "@/app/components/ui/Skeleton";

/**
 * Kerangka AnnouncementForm: penerima, judul, isi (3 baris), lalu tombol kirim.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame title="Pengumuman" description="Kirim pengumuman ke notifikasi aplikasi pembeli dan penjual.">
      <div className="flex max-w-2xl flex-col gap-4 rounded-lg border border-line bg-surface p-4">
        <SkeletonField label="w-20" />
        <SkeletonField label="w-12" />
        <SkeletonField label="w-10" height="h-24" />
        <div>
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
    </PageFrame>
  );
}
