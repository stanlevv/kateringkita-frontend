// Kerangka memuat /admin/banner. loading.tsx tampil otomatis selama page.tsx menunggu data dari backend.
import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList } from "@/app/components/ui/Skeleton";

/**
 * Kerangka BannerAdmin: tombol buat banner platform + kartu banner.
 * @returns PageFrame berisi kerangka
 */
export default function Loading() {
  return (
    <PageFrame
      title="Banner"
      description="Banner beranda aplikasi pembeli. Pengajuan penjual menunggu persetujuan; banner platform langsung tayang."
    >
      <SkeletonList columns={3} />
    </PageFrame>
  );
}
