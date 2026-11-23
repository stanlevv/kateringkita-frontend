import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList } from "@/app/components/ui/Skeleton";

// BannerAdmin: tombol buat banner platform + kartu banner
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
