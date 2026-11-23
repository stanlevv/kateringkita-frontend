import { PageFrame } from "@/app/components/shell/PageFrame";
import { SkeletonList } from "@/app/components/ui/Skeleton";

// BannerToko: tombol ajukan + kartu banner
export default function Loading() {
  return (
    <PageFrame
      title="Banner"
      description="Pasang banner tokomu di beranda aplikasi pembeli. Tampil setelah disetujui admin."
    >
      <SkeletonList columns={2} />
    </PageFrame>
  );
}
